-- AlterTable
ALTER TABLE "estabelecimentos" ADD COLUMN "pix_chave" VARCHAR(100),
ADD COLUMN "pix_tipo" TEXT,
ADD COLUMN "banco_nome" VARCHAR(100),
ADD COLUMN "agencia" VARCHAR(10),
ADD COLUMN "conta" VARCHAR(20);
