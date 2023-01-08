import type { ZodiosPlugin } from "@zodios/core";

/**
 * clear one header
 * @param baseURL - the header key to be deleted
 * @returns ZodiosPlugin
 */
export function pluginClearHeader(key: string): ZodiosPlugin {
  return {
    request: async (_, config) => {
      const headers: Record<string, string> = { ...config.headers };
      if (headers[key]) delete headers[key];

      return {
        ...config,
        headers,
      };
    },
  };
}
