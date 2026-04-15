import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@asa/shared": path.resolve(__dirname, "packages/shared/src"),
      "@asa/database": path.resolve(__dirname, "packages/database/src"),
    },
  },
});
