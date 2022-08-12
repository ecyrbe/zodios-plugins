import { ZodiosPlugin } from "@zodios/core";
import { fetchAdapter } from "./fetch";
import { FetchPluginOptions } from "./fetch.types";

export function pluginFetch(options?: FetchPluginOptions): ZodiosPlugin {
  return {
    name: "fetch",
    request: async (_, config) => {
      return {
        ...config,
        ...options,
        adapter: fetchAdapter,
      };
    },
  };
}
