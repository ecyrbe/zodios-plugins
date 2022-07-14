import type { ZodiosPlugin } from "@zodios/core";

export function pluginHeader(
  key: string,
  valueFn: () => Promise<string>
): ZodiosPlugin {
  return {
    request: async (_, config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          [key]: await valueFn(),
        },
      };
    },
  };
}
