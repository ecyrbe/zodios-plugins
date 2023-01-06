import type { ZodiosPlugin } from "@zodios/core";

/**
 * override the default baseURL
 * @param baseURL - the new baseUrl
 * @returns Zodios plugin
 */
export function pluginBaseURL(baseURL: string): ZodiosPlugin {
  return {
    name: "pluginBaseURL",
    request: async (_endpoint, config) => {
      return { ...config, baseURL };
    },
  };
}
