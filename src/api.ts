import { ZodiosPlugin } from "@zodios/core";

const plugin: ZodiosPlugin = {
  name: "api",
  request: async (api, config) => {
    if (config.method !== "get") {
      return {
        ...config,
        headers: {
          ...config.headers,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
    } else {
      return {
        ...config,
        headers: {
          ...config.headers,
          Accept: "application/json",
        },
      };
    }
  },
};

/**
 * plugin that add application/json header to all requests
 * @param zodios
 */
export function pluginApi() {
  return plugin;
}
