-- Migration Manual: Add Comercial Profile and Regras
-- Executado em: 2026-07-05
-- Banco: Neon Production

-- 1. Add COMERCIAL to TipoUsuario (se não existir)
DO $$ BEGIN
  ALTER TYPE "TipoUsuario" ADD VALUE 'COMERCIAL';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN invalid_parameter_value THEN null; -- Valor já existe
END $$;

-- 2. Add FuncaoComercial enum
DO $$ BEGIN
  CREATE TYPE "FuncaoComercial" AS ENUM (
    'GERENTE_CIRE',
    'SUPERVISOR_ATIVO',
    'SUPERVISOR_RECEPTIVO',
    'SUPERVISOR_FRANQUIA',
    'SUPERVISOR_ATENDIMENTO',
    'GERENTE_ATENDIMENTO',
    'SUPERVISOR_COMERCIAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create table comerciais
CREATE TABLE IF NOT EXISTS "comerciais" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "funcao" "FuncaoComercial",
    "percentual_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comerciais_pkey" PRIMARY KEY ("id")
);

-- 4. Create table metas_comerciais
CREATE TABLE IF NOT EXISTS "metas_comerciais" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "comercial_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_meta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_atingido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_comerciais_pkey" PRIMARY KEY ("id")
);

-- 5. Create table comissoes_comerciais
CREATE TABLE IF NOT EXISTS "comissoes_comerciais" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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

-- 6. Create table regras_comerciais
CREATE TABLE IF NOT EXISTS "regras_comerciais" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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

-- 7. Create table regras_gestores
CREATE TABLE IF NOT EXISTS "regras_gestores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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

-- 8. Add column comercial_id to procedimentos_pf (se não existir)
DO $$ BEGIN
  ALTER TABLE "procedimentos_pf" ADD COLUMN "comercial_id" UUID;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS "comerciais_usuario_id_idx" ON "comerciais"("usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "comerciais_cpf_key" ON "comerciais"("cpf");
CREATE INDEX IF NOT EXISTS "comerciais_gestor_pf_id_idx" ON "comerciais"("gestor_pf_id");

CREATE UNIQUE INDEX IF NOT EXISTS "metas_comerciais_comercial_id_mes_referencia_key" ON "metas_comerciais"("comercial_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "metas_comerciais_comercial_id_idx" ON "metas_comerciais"("comercial_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comissoes_comerciais_comercial_id_mes_referencia_key" ON "comissoes_comerciais"("comercial_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "comissoes_comerciais_comercial_id_idx" ON "comissoes_comerciais"("comercial_id");

CREATE UNIQUE INDEX IF NOT EXISTS "regras_comerciais_gestor_pf_id_key" ON "regras_comerciais"("gestor_pf_id");
CREATE INDEX IF NOT EXISTS "regras_comerciais_gestor_pf_id_idx" ON "regras_comerciais"("gestor_pf_id");

CREATE UNIQUE INDEX IF NOT EXISTS "regras_gestores_gestor_pf_id_key" ON "regras_gestores"("gestor_pf_id");
CREATE INDEX IF NOT EXISTS "regras_gestores_gestor_pf_id_idx" ON "regras_gestores"("gestor_pf_id");

CREATE INDEX IF NOT EXISTS "procedimentos_pf_comercial_id_idx" ON "procedimentos_pf"("comercial_id");

-- 10. Add foreign keys
DO $$ BEGIN
  ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_usuario_id_fkey" 
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_gestor_pf_id_fkey" 
    FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "metas_comerciais" ADD CONSTRAINT "metas_comerciais_comercial_id_fkey" 
    FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "comissoes_comerciais" ADD CONSTRAINT "comissoes_comerciais_comercial_id_fkey" 
    FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_gestor_pf_id_fkey" 
    FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_gestor_pf_id_fkey" 
    FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_comercial_id_fkey" 
    FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN null;
  WHEN duplicate_object THEN null;
END $$;