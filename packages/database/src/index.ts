import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const dbUrl = process.env.DATABASE_URL || "";
const isTestDb = /\/asa_db($|\?)/.test(dbUrl) && !/\/asa_db_test/.test(dbUrl);
const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

if (isTestDb && !isTestEnv && process.env.NODE_ENV !== "development") {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, "//***@");
  throw new Error(
    `🚫 BLOQUEIO CRÍTICO: Tentativa de acessar banco 'asa_db' fora do ambiente de teste.\n` +
    `   DATABASE_URL: ${maskedUrl}\n` +
    `   NODE_ENV: ${process.env.NODE_ENV}\n` +
    `   Use 'asa_db_test' para testes ou defina NODE_ENV=development`
  );
}

if (isTestDb && !dbUrl.includes("asa_db_test") && isTestEnv) {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, "//***@");
  throw new Error(
    `🚫 BLOQUEIO: Testes DEVEM usar 'asa_db_test', não 'asa_db'.\n` +
    `   DATABASE_URL detectada: ${maskedUrl}\n` +
    `   Corrija para: postgresql://.../asa_db_test`
  );
}

export * from "@prisma/client";
export default prisma;
