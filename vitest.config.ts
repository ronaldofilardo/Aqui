import { defineConfig } from "vitest/config";
import path from "path";
import { randomBytes } from "crypto";

// Generate random test secret each run (never hardcoded)
const testSecret = randomBytes(32).toString("base64");

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      NEXTAUTH_SECRET: testSecret,
    },
  },
  resolve: {
    alias: {
      "@asa/shared": path.resolve(__dirname, "packages/shared/src"),
      "@asa/database": path.resolve(__dirname, "packages/database/src"),
      "@": path.resolve(__dirname, "apps/web"),
    },
  },
});
