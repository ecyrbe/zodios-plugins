import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ZodiosInstance } from "@zodios/core";
import type {
  AxiosRetryRequestConfig,
  ZodiosEnpointDescriptions,
} from "@zodios/core";

export type TokenProvider = {
  getToken: () => Promise<string | undefined>;
  renewToken?: () => Promise<void>;
};

function createRequestInterceptor(provider: TokenProvider) {
  return async (config: AxiosRequestConfig) => {
    const token = await provider.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  };
}

function createErrorResponseInterceptor(
  instance: AxiosInstance,
  provider: TokenProvider
) {
  return async (error: Error) => {
    if (axios.isAxiosError(error) && provider.renewToken) {
      const retryConfig = error.config as AxiosRetryRequestConfig;
      if (error.response?.status === 401 && !retryConfig.retried) {
        retryConfig.retried = true;
        await provider.renewToken();
        return instance.request(retryConfig);
      }
    }
    throw error;
  };
}

export function pluginToken<Api extends ZodiosEnpointDescriptions>(
  provider: TokenProvider
) {
  return (zodios: ZodiosInstance<Api>) => {
    zodios.axios.interceptors.request.use(createRequestInterceptor(provider));
    if (provider?.renewToken) {
      zodios.axios.interceptors.response.use(
        undefined,
        createErrorResponseInterceptor(zodios.axios, provider)
      );
    }
  };
}
