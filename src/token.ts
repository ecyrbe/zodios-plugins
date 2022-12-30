import axios, { AxiosError } from "axios";
import { ZodiosError, ZodiosPlugin } from "@zodios/core";

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
  let isRenewPending = false;

  return {
    request: async (_, config) => {
      if (isRenewPending) {
        // Wait for any pending renew request
        try {
          await pendingRenew;
        } catch (error) {
          throw new ZodiosError(
            "Renew token request failed",
            config,
            undefined,
            error instanceof Error ? error : undefined
          );
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
              if (!isRenewPending) {
                isRenewPending = true;
                pendingRenew = provider.renewToken().then((token) => {
                  isRenewPending = false;
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
