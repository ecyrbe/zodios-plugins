import { AxiosRequestConfig } from "axios";
import { ZodiosInstance, ZodiosPlugin } from "@zodios/core";
import type { ZodiosEnpointDescriptions } from "@zodios/core";

const plugin: ZodiosPlugin = {
  name: "api",
  request: async (api, config) => {
    // istanbul ignore next
    if (!config.headers) {
      config.headers = {};
    }
    if (config.method !== "get") {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    } else {
      config.headers = {
        ...config.headers,
        Accept: "application/json",
      };
    }
    return config;
  },
};

/**
 * plugin that add application/json header to all requests
 * @param zodios
 */
export function pluginApi() {
  return plugin;
}
