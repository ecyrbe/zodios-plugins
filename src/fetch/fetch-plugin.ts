import { ZodiosPlugin } from "@zodios/core";
import { fetchAdapter } from "./fetch";
import { FetchPluginOptions } from "./fetch.types";

export function pluginFetch(options?: FetchPluginOptions): ZodiosPlugin {
  return {
    name: "fetch",
    request: async (api, config) => {
      if (config.method !== "get" && config?.headers?.["Content-Type"]) {
        const endpoint = api.find(
          (endpoint) =>
            endpoint.path === config.url && endpoint.method === config.method
        );
        if (endpoint && endpoint.requestFormat === "form-data") {
          // @ts-ignore
          delete config.headers["Content-Type"];
        }
      }
      return {
        ...config,
        ...options,
        adapter: fetchAdapter,
      };
    },
  };
}
