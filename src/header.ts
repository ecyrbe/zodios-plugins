import { AxiosRequestConfig } from "axios";
import { ZodiosInstance } from "@zodios/core";
import type { ZodiosEnpointDescriptions } from "@zodios/core";

export function pluginHeader<Api extends ZodiosEnpointDescriptions>(
  key: string,
  valueFn: () => Promise<string>
) {
  return (zodios: ZodiosInstance<Api>) => {
    zodios.axios.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        config.headers = {
          ...config.headers,
          [key]: await valueFn(),
        };
        return config;
      }
    );
  };
}
