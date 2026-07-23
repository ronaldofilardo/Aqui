import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.VITEST = 'true';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/__tests__/**/*.test.ts', 'app/__tests__/**/*.test.tsx'],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
});