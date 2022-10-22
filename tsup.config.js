import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    "src/index.ts",
    "src/api.ts",
    "src/fetch/fetch-plugin.ts",
    "src/header.ts",
    "src/token.ts",
  ],
  outDir: "lib",
  format: ["cjs", "esm"],
  minify: true,
  treeshake: true,
  tsconfig: "tsconfig.build.json",
  splitting: true,
  sourcemap: false,
});
