import axios, { AxiosError } from "axios";
import { ZodiosPlugin } from "@zodios/core";

export type TokenProvider = {
  getToken: () => Promise<string | undefined>;
  renewToken?: () => Promise<string | undefined>;
};

function isTokenRenewed(newToken: string | undefined, error: AxiosError) {
  if (!(newToken && error.config?.headers)) return false;
  const oldCredentials = error.config.headers["Authorization"] as string;
  return !oldCredentials.includes(newToken);
}

export function pluginToken(provider: TokenProvider): ZodiosPlugin {
  let pendingRenew: Promise<string | undefined> | undefined;

  return {
    request: async (_, config) => {
      if (pendingRenew) {
        // Wait for any pending renew request
        try {
          await pendingRenew;
        } catch (error) {
          throw new axios.Cancel("Renew token request failed");
        }
      }
      const token = await provider.getToken();
      if (token) {
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        };
      }

      return config;
    },
    error: provider.renewToken
      ? async (_, __, error) => {
          if (
            axios.isAxiosError(error) &&
            provider.renewToken &&
            error.config
          ) {
            if (error.response?.status === 401) {
              if (!pendingRenew) {
                pendingRenew = provider.renewToken().then((token) => {
                  pendingRenew = undefined;
                  return token;
                });
              }
              const newToken = await pendingRenew;

              if (isTokenRenewed(newToken, error)) {
                const retryConfig = { ...error.config };
                // @ts-ignore
                retryConfig.headers = {
                  ...retryConfig.headers,
                  Authorization: `Bearer ${newToken}`,
                };
                // retry with new token and without interceptors
                return axios(retryConfig);
              }
            }
          }
          throw error;
        }
      : undefined,
  };
}
