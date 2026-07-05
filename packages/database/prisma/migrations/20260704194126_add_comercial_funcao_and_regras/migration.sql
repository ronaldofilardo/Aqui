-- CreateEnum
CREATE TYPE "FuncaoComercial" AS ENUM ('GERENTE_CIRE', 'SUPERVISOR_ATIVO', 'SUPERVISOR_RECEPTIVO', 'SUPERVISOR_FRANQUIA', 'SUPERVISOR_ATENDIMENTO', 'GERENTE_ATENDIMENTO', 'SUPERVISOR_COMERCIAL');

-- AlterTable
ALTER TABLE "comerciais" ADD COLUMN     "funcao" "FuncaoComercial";

-- CreateTable
CREATE TABLE "regras_comerciais" (
    "id" UUID NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "cartao_acesso_saude" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cire_ativo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cire_receptivo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "franchising_acesso" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "franchising_cartao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "unidade" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_gestores" (
    "id" UUID NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "gerente_cire" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_ativo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_receptivo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_franquia" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_atendimento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gerente_atendimento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_comercial" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_gestores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regras_comerciais_gestor_pf_id_idx" ON "regras_comerciais"("gestor_pf_id");

-- CreateIndex
CREATE UNIQUE INDEX "regras_comerciais_gestor_pf_id_key" ON "regras_comerciais"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "regras_gestores_gestor_pf_id_idx" ON "regras_gestores"("gestor_pf_id");

-- CreateIndex
CREATE UNIQUE INDEX "regras_gestores_gestor_pf_id_key" ON "regras_gestores"("gestor_pf_id");

-- AddForeignKey
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
