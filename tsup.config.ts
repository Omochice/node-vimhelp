import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/*"],
  target: ["es2023"],
  outDir: "lib",
  dts: true,
  splitting: false,
  clean: true,
  format: ["cjs", "esm"],
});
