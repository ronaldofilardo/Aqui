import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const dbUrl = process.env.DATABASE_URL || "";
const isProdDb = /\/aqui_db($|\?)/.test(dbUrl) && !/\/aqui_db_test/.test(dbUrl);
const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

if (isProdDb && !isTestEnv && process.env.NODE_ENV !== "development") {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, "//***@");
  throw new Error(
    `Bloqueio: Tentativa de acessar banco 'aqui_db' fora do ambiente de teste.\n` +
    `   DATABASE_URL: ${maskedUrl}\n` +
    `   NODE_ENV: ${process.env.NODE_ENV}\n` +
    `   Use 'aqui_db_test' para testes ou defina NODE_ENV=development`
  );
}

if (isProdDb && !dbUrl.includes("aqui_db_test") && isTestEnv) {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, "//***@");
  throw new Error(
    `Bloqueio: Testes DEVEM usar 'aqui_db_test', nao 'aqui_db'.\n` +
    `   DATABASE_URL detectada: ${maskedUrl}\n` +
    `   Corrija para: postgresql://.../aqui_db_test`
  );
}

export * from "@prisma/client";
export default prisma;
