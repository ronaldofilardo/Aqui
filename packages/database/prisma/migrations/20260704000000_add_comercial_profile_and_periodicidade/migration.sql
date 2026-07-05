-- Add COMERCIAL value to TipoUsuario enum
ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'COMERCIAL';

-- Create new enum PeriodicidadeCiclo
DO $$ BEGIN
  CREATE TYPE "PeriodicidadeCiclo" AS ENUM ('SEMESTRAL', 'ANUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable parceiros: make percentual_comissao optional, add periodicidade_ciclo_escolhida
ALTER TABLE "parceiros" ALTER COLUMN "percentual_comissao" DROP NOT NULL;
ALTER TABLE "parceiros" ADD COLUMN IF NOT EXISTS "periodicidade_ciclo_escolhida" "PeriodicidadeCiclo";

-- AlterTable ciclos_pontos: add periodicidade with default ANUAL
ALTER TABLE "ciclos_pontos" ADD COLUMN IF NOT EXISTS "periodicidade" "PeriodicidadeCiclo" NOT NULL DEFAULT 'ANUAL';

-- AlterTable procedimentos_pf: add comercial_id
ALTER TABLE "procedimentos_pf" ADD COLUMN IF NOT EXISTS "comercial_id" UUID;

-- CreateTable comerciais
CREATE TABLE IF NOT EXISTS "comerciais" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "percentual_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable metas_comerciais
CREATE TABLE IF NOT EXISTS "metas_comerciais" (
    "id" UUID NOT NULL,
    "comercial_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_meta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_atingido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable comissoes_comerciais
CREATE TABLE IF NOT EXISTS "comissoes_comerciais" (
    "id" UUID NOT NULL,
    "comercial_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_vendas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_comissao" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "StatusComissao" NOT NULL DEFAULT 'CALCULADA',
    "data_pagamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex comerciais
CREATE UNIQUE INDEX IF NOT EXISTS "comerciais_usuario_id_key" ON "comerciais"("usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "comerciais_cpf_key" ON "comerciais"("cpf");
CREATE INDEX IF NOT EXISTS "comerciais_gestor_pf_id_idx" ON "comerciais"("gestor_pf_id");

-- CreateIndex metas_comerciais
CREATE UNIQUE INDEX IF NOT EXISTS "metas_comerciais_comercial_id_mes_referencia_key" ON "metas_comerciais"("comercial_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "metas_comerciais_comercial_id_idx" ON "metas_comerciais"("comercial_id");

-- CreateIndex comissoes_comerciais
CREATE UNIQUE INDEX IF NOT EXISTS "comissoes_comerciais_comercial_id_mes_referencia_key" ON "comissoes_comerciais"("comercial_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "comissoes_comerciais_comercial_id_idx" ON "comissoes_comerciais"("comercial_id");

-- CreateIndex procedimentos_pf
CREATE INDEX IF NOT EXISTS "procedimentos_pf_comercial_id_idx" ON "procedimentos_pf"("comercial_id");

-- AddForeignKey comerciais -> usuarios
DO $$ BEGIN
  ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey comerciais -> gestores_pf
DO $$ BEGIN
  ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey metas_comerciais -> comerciais
DO $$ BEGIN
  ALTER TABLE "metas_comerciais" ADD CONSTRAINT "metas_comerciais_comercial_id_fkey" FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey comissoes_comerciais -> comerciais
DO $$ BEGIN
  ALTER TABLE "comissoes_comerciais" ADD CONSTRAINT "comissoes_comerciais_comercial_id_fkey" FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey procedimentos_pf -> comerciais
DO $$ BEGIN
  ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_comercial_id_fkey" FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
