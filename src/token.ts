import axios, { AxiosError } from "axios";
import { ZodiosPlugin } from "@zodios/core";

export type TokenProvider = {
  getToken: () => Promise<string | undefined>;
  renewToken?: () => Promise<string | undefined>;
};

function isTokenRenewed(newToken: string | undefined, error: AxiosError) {
  return newToken && getTokenFromHeader(error) !== newToken;
}

function getTokenFromHeader(error: AxiosError) {
  if (error.config?.headers) {
    const oldCredentials = error.config.headers["Authorization"] as string;
    return oldCredentials.replace("Bearer ", "");
  }
  return undefined;
}

export function pluginToken(provider: TokenProvider): ZodiosPlugin {
  let asyncRenewPending = Promise.resolve<string | undefined>(undefined);
  let expiredToken: string | undefined;

  return {
    request: async (_, config) => {
      let token = await provider.getToken();
      if (token) {
        // Wait for any pending renew request
        if (token === expiredToken) {
          try {
            token = await asyncRenewPending;
          } catch (error) {
            throw new axios.Cancel("Renew token request failed");
          }
        }

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
              const thisToken = getTokenFromHeader(error);
              if (expiredToken !== thisToken) {
                expiredToken = thisToken;
                asyncRenewPending = provider.renewToken();
              }
              const newToken = await asyncRenewPending;

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
