-- Migration: Add PF Domain (GestorPF, Parceiro, Indicado, UploadPlanilhaPF, ProcedimentoPF, ComissaoParceiro, PrimeiraAcss)
-- Created: 2026-06-24

-- Create enums
CREATE TYPE "StatusParceiro" AS ENUM ('ATIVO', 'DESLIGADO');
CREATE TYPE "StatusIndicado" AS ENUM ('ATIVO', 'DESVINCULADO');
CREATE TYPE "StatusUpload" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'ERRO');
CREATE TYPE "StatusComissao" AS ENUM ('PENDENTE', 'CALCULADA', 'PAGA');
CREATE TYPE "StatusProcedimento" AS ENUM ('PENDENTE', 'CALCULADA', 'PAGA');

-- Add new variants to TipoUsuario enum
ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'GESTOR_PF';
ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'PARCEIRO';

-- Create table: gestores_pf
CREATE TABLE "gestores_pf" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID UNIQUE NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) UNIQUE NOT NULL,
    "percentual_comissao_default" DECIMAL(5,2) DEFAULT 5.00,
    "percentual_comissao_max" DECIMAL(5,2) DEFAULT 100.00,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: parceiros
CREATE TABLE "parceiros" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID UNIQUE NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) UNIQUE NOT NULL,
    "pix_chave" VARCHAR(100),
    "percentual_comissao" DECIMAL(5,2) NOT NULL,
    "status" "StatusParceiro" DEFAULT 'ATIVO',
    "gestor_pf_id" UUID NOT NULL,
    "desligado_em" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "parceiros_gestor_pf_id_idx" ON "parceiros"("gestor_pf_id");

-- Create table: indicados
CREATE TABLE "indicados" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "telefone" VARCHAR(20),
    "status" "StatusIndicado" DEFAULT 'ATIVO',
    "parceiro_id" UUID NOT NULL,
    "desvinculado_em" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "indicados_cpf_unique" UNIQUE ("cpf")
);

CREATE INDEX "indicados_cpf_idx" ON "indicados"("cpf");
CREATE INDEX "indicados_parceiro_id_idx" ON "indicados"("parceiro_id");

-- Create table: uploads_planilha_pf
CREATE TABLE "uploads_planilha_pf" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "gestor_pf_id" UUID NOT NULL,
    "nome_arquivo" VARCHAR(255) NOT NULL,
    "mes_referencia" VARCHAR(7) NOT NULL,
    "status" "StatusUpload" DEFAULT 'PROCESSANDO',
    "total_rows" INT DEFAULT 0,
    "processed_rows" INT DEFAULT 0,
    "rejected_rows" INT DEFAULT 0,
    "orphaned_rows" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "uploads_planilha_pf_gestor_pf_id_idx" ON "uploads_planilha_pf"("gestor_pf_id");
CREATE INDEX "uploads_planilha_pf_mes_referencia_idx" ON "uploads_planilha_pf"("mes_referencia");

-- Create table: procedimentos_pf
CREATE TABLE "procedimentos_pf" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "data_referencia" TIMESTAMPTZ NOT NULL,
    "data_pagamento" TIMESTAMPTZ NOT NULL,
    "forma_pagamento" VARCHAR(50) NOT NULL,
    "total_pago" DECIMAL(10,2) NOT NULL,
    "paciente" VARCHAR(255) NOT NULL,
    "procedimento" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "tipo_procedimento" VARCHAR(50) NOT NULL,
    "unidade" VARCHAR(100) NOT NULL,
    "indicado_id" UUID,
    "parceiro_id" UUID,
    "upload_id" UUID NOT NULL,
    "valor_comissao" DECIMAL(10,2) DEFAULT 0,
    "status_comissao" "StatusProcedimento" DEFAULT 'PENDENTE',
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "procedimentos_pf_unique" UNIQUE ("data_referencia", "cpf", "procedimento", "unidade")
);

CREATE INDEX "procedimentos_pf_cpf_idx" ON "procedimentos_pf"("cpf");
CREATE INDEX "procedimentos_pf_indicado_id_idx" ON "procedimentos_pf"("indicado_id");
CREATE INDEX "procedimentos_pf_parceiro_id_idx" ON "procedimentos_pf"("parceiro_id");
CREATE INDEX "procedimentos_pf_upload_id_idx" ON "procedimentos_pf"("upload_id");

-- Create table: comissoes_parceiros
CREATE TABLE "comissoes_parceiros" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "parceiro_id" UUID NOT NULL,
    "mes_referencia" VARCHAR(7) NOT NULL,
    "valor_total" DECIMAL(12,2) DEFAULT 0,
    "status" "StatusComissao" DEFAULT 'PENDENTE',
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "comissoes_parceiros_unique" UNIQUE ("parceiro_id", "mes_referencia")
);

CREATE INDEX "comissoes_parceiros_parceiro_id_idx" ON "comissoes_parceiros"("parceiro_id");

-- Create table: primeira_acss
CREATE TABLE "primeira_acss" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "parceiro_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "primeira_acss_token_idx" ON "primeira_acss"("token");

-- Add foreign key constraints
ALTER TABLE "gestores_pf" ADD CONSTRAINT "gestores_pf_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE;
ALTER TABLE "indicados" ADD CONSTRAINT "indicados_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE;
ALTER TABLE "uploads_planilha_pf" ADD CONSTRAINT "uploads_planilha_pf_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE;
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_indicado_id_fkey" FOREIGN KEY ("indicado_id") REFERENCES "indicados"("id") ON DELETE SET NULL;
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE SET NULL;
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads_planilha_pf"("id") ON DELETE CASCADE;
ALTER TABLE "comissoes_parceiros" ADD CONSTRAINT "comissoes_parceiros_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE;
ALTER TABLE "primeira_acss" ADD CONSTRAINT "primeira_acss_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE;