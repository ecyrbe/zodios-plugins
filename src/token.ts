import axios from "axios";
import { ZodiosPlugin } from "@zodios/core";
import type { AxiosRetryRequestConfig } from "@zodios/core";

export type TokenProvider = {
  getToken: () => Promise<string | undefined>;
  renewToken?: () => Promise<void>;
};

export function pluginToken(provider: TokenProvider): ZodiosPlugin {
  return {
    request: async (_, config) => {
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
          if (axios.isAxiosError(error) && provider.renewToken) {
            const retryConfig = error.config as AxiosRetryRequestConfig;
            if (error.response?.status === 401 && !retryConfig.retried) {
              retryConfig.retried = true;
              await provider.renewToken();
              return axios(retryConfig);
            }
          }
          throw error;
        }
      : undefined,
  };
}
