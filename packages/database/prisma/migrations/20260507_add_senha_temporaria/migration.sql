-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "senha_temporaria" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "usuarios_estabelecimentos" ADD COLUMN "senha_temporaria" BOOLEAN NOT NULL DEFAULT true;
