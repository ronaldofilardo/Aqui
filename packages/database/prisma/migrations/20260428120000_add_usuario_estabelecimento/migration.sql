-- CreateEnum
CREATE TYPE "TipoAcessoEstabelecimento" AS ENUM ('PROPRIETARIO', 'VISUALIZADOR');

-- CreateTable
CREATE TABLE "usuarios_estabelecimentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estabelecimento_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "tipo" "TipoAcessoEstabelecimento" NOT NULL DEFAULT 'PROPRIETARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_estabelecimentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_estabelecimentos_email_key" ON "usuarios_estabelecimentos"("email");

-- CreateIndex
CREATE INDEX "usuarios_estabelecimentos_estabelecimento_id_idx" ON "usuarios_estabelecimentos"("estabelecimento_id");

-- AddForeignKey
ALTER TABLE "usuarios_estabelecimentos" ADD CONSTRAINT "usuarios_estabelecimentos_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
