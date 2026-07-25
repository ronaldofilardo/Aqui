import { defineConfig } from "vitest/config";
import path from "path";
import { randomBytes } from "crypto";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Generate random test secret each run (never hardcoded)
const testSecret = randomBytes(32).toString("base64");
// Workaround para tipagem de NODE_ENV readonly em TS5
(process.env as Record<string, string | undefined>).NODE_ENV = process.env.NODE_ENV ?? 'test';

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      NEXTAUTH_SECRET: testSecret,
      DATABASE_URL: process.env.DATABASE_URL,
    },
    server: {
      deps: {
        // next-auth importa "next/server" em ESM; sem exports map no package.json
        // do next, Node não resolve "next/server" (sem extensão). Marcando next-auth
        // como noExternal faz o Vite processar seus imports e aplicar o alias.
        inline: ["next-auth"],
      },
    },
  },
  resolve: {
    alias: {
      "@aqui/shared": path.resolve(__dirname, "packages/shared/src"),
      "@aqui/database": path.resolve(__dirname, "packages/database/src"),
      "@": path.resolve(__dirname, "apps/web"),
      // next-auth/lib/env.js importa "next/server" em ESM; sem exports map,
      // Node não resolve "next/server" (sem extensão). Aponta para o JS real.
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
    },
  },
});
