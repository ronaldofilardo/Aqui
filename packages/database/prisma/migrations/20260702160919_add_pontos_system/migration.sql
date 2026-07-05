/*
  Warnings:

  - You are about to drop the column `total_comissoes` on the `consultores` table. All the data in the column will be lost.
  - You are about to drop the `comissoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pagamentos` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PapelGestor" AS ENUM ('GESTOR_PF', 'GESTOR_PJ');

-- CreateEnum
CREATE TYPE "StatusParceiro" AS ENUM ('ATIVO', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "StatusIndicado" AS ENUM ('ATIVO', 'DESVINCULADO');

-- CreateEnum
CREATE TYPE "StatusUpload" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'ERRO');

-- CreateEnum
CREATE TYPE "StatusComissao" AS ENUM ('PENDENTE', 'CALCULADA', 'PAGA');

-- CreateEnum
CREATE TYPE "StatusProcedimento" AS ENUM ('PENDENTE', 'CALCULADA', 'PAGA');

-- CreateEnum
CREATE TYPE "TipoMovimentacaoPontos" AS ENUM ('CREDITO', 'DEBITO', 'ESTORNO');

-- CreateEnum
CREATE TYPE "OrigemMovimentacaoPontos" AS ENUM ('PRODUCAO_IMPORTADA', 'RESGATE', 'ESTORNO_RESGATE', 'EXPIRACAO', 'AJUSTE_MANUAL');

-- CreateEnum
CREATE TYPE "StatusCicloPontos" AS ENUM ('EM_ANDAMENTO', 'RESGATE_ABERTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoArredondamento" AS ENUM ('PISO', 'TETO', 'PADRAO');

-- CreateEnum
CREATE TYPE "StatusSolicitacaoResgate" AS ENUM ('SOLICITADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'ENTREGUE', 'CANCELADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoUsuario" ADD VALUE 'GESTOR_PF';
ALTER TYPE "TipoUsuario" ADD VALUE 'PARCEIRO';

-- DropForeignKey
ALTER TABLE "comissoes" DROP CONSTRAINT "comissoes_consulta_id_fkey";

-- DropForeignKey
ALTER TABLE "comissoes" DROP CONSTRAINT "comissoes_consultor_id_fkey";

-- DropForeignKey
ALTER TABLE "comissoes" DROP CONSTRAINT "comissoes_estabelecimento_id_fkey";

-- DropForeignKey
ALTER TABLE "pagamentos" DROP CONSTRAINT "pagamentos_consultor_id_fkey";

-- AlterTable
ALTER TABLE "consultores" DROP COLUMN "total_comissoes";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "papel" "PapelGestor";

-- DropTable
DROP TABLE "comissoes";

-- DropTable
DROP TABLE "pagamentos";

-- DropEnum
DROP TYPE "StatusPagamento";

-- DropEnum
DROP TYPE "StatusPagamentoComissao";

-- CreateTable
CREATE TABLE "gestores_pf" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "percentual_comissao_default" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "percentual_comissao_max" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestores_pf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parceiros" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "pix_chave" VARCHAR(100),
    "percentual_comissao" DECIMAL(5,2) NOT NULL,
    "status" "StatusParceiro" NOT NULL DEFAULT 'ATIVO',
    "gestor_pf_id" UUID NOT NULL,
    "desligado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parceiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicados" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "telefone" VARCHAR(20),
    "status" "StatusIndicado" NOT NULL DEFAULT 'ATIVO',
    "parceiro_id" UUID NOT NULL,
    "desvinculado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads_planilha_pf" (
    "id" UUID NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "nomeArquivo" VARCHAR(255) NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "status" "StatusUpload" NOT NULL DEFAULT 'PROCESSANDO',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "rejected_rows" INTEGER NOT NULL DEFAULT 0,
    "orphaned_rows" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploads_planilha_pf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedimentos_pf" (
    "id" UUID NOT NULL,
    "data_referencia" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3) NOT NULL,
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
    "valor_comissao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status_comissao" "StatusProcedimento" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedimentos_pf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes_parceiros" (
    "id" UUID NOT NULL,
    "parceiro_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "StatusComissao" NOT NULL DEFAULT 'PENDENTE',
    "data_pagamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_parceiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primeira_acss" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "parceiro_id" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "primeira_acss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base_clientes_acesso_saude" (
    "cpf" VARCHAR(11) NOT NULL,

    CONSTRAINT "base_clientes_acesso_saude_pkey" PRIMARY KEY ("cpf")
);

-- CreateTable
CREATE TABLE "configuracoes_pontos" (
    "id" UUID NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "valor_por_ponto" DECIMAL(10,2) NOT NULL,
    "tipo_arredondamento" "TipoArredondamento" NOT NULL DEFAULT 'PADRAO',
    "vigente_desde" TIMESTAMP(3) NOT NULL,
    "vigente_ate" TIMESTAMP(3),
    "criado_por" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclos_pontos" (
    "id" UUID NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "inicio_acumulo_em" TIMESTAMP(3) NOT NULL,
    "fim_acumulo_em" TIMESTAMP(3) NOT NULL,
    "fim_resgate_em" TIMESTAMP(3) NOT NULL,
    "status" "StatusCicloPontos" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "processado_expiracao_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ciclos_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_pontos" (
    "id" UUID NOT NULL,
    "parceiro_id" UUID NOT NULL,
    "ciclo_pontos_id" UUID NOT NULL,
    "tipo" "TipoMovimentacaoPontos" NOT NULL,
    "origem" "OrigemMovimentacaoPontos" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "referencia_procedimento_id" UUID,
    "referencia_solicitacao_resgate_id" UUID,
    "configuracao_pontos_id" UUID,
    "observacao" TEXT,
    "criado_por" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" UUID NOT NULL,
    "ciclo_pontos_id" UUID NOT NULL,
    "referencia_mes" VARCHAR(7) NOT NULL,
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_posicoes" (
    "id" UUID NOT NULL,
    "ranking_snapshot_id" UUID NOT NULL,
    "parceiro_id" UUID NOT NULL,
    "posicao" INTEGER NOT NULL,
    "pontos_acumulados" INTEGER NOT NULL,

    CONSTRAINT "ranking_posicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premios" (
    "id" UUID NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo_pontos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imagem_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_resgate" (
    "id" UUID NOT NULL,
    "parceiro_id" UUID NOT NULL,
    "premio_id" UUID NOT NULL,
    "ciclo_pontos_id" UUID NOT NULL,
    "pontos_debitados" INTEGER NOT NULL,
    "status" "StatusSolicitacaoResgate" NOT NULL DEFAULT 'SOLICITADO',
    "solicitado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processado_por" UUID,
    "processado_em" TIMESTAMP(3),
    "entregue_em" TIMESTAMP(3),
    "cancelado_em" TIMESTAMP(3),
    "observacao" TEXT,

    CONSTRAINT "solicitacoes_resgate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestores_pf_usuario_id_key" ON "gestores_pf"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "gestores_pf_cpf_key" ON "gestores_pf"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "parceiros_usuario_id_key" ON "parceiros"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "parceiros_cpf_key" ON "parceiros"("cpf");

-- CreateIndex
CREATE INDEX "parceiros_gestor_pf_id_idx" ON "parceiros"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "indicados_cpf_idx" ON "indicados"("cpf");

-- CreateIndex
CREATE INDEX "indicados_parceiro_id_idx" ON "indicados"("parceiro_id");

-- CreateIndex
CREATE UNIQUE INDEX "indicados_cpf_key" ON "indicados"("cpf");

-- CreateIndex
CREATE INDEX "uploads_planilha_pf_gestor_pf_id_idx" ON "uploads_planilha_pf"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "uploads_planilha_pf_mes_referencia_idx" ON "uploads_planilha_pf"("mes_referencia");

-- CreateIndex
CREATE INDEX "procedimentos_pf_cpf_idx" ON "procedimentos_pf"("cpf");

-- CreateIndex
CREATE INDEX "procedimentos_pf_indicado_id_idx" ON "procedimentos_pf"("indicado_id");

-- CreateIndex
CREATE INDEX "procedimentos_pf_parceiro_id_idx" ON "procedimentos_pf"("parceiro_id");

-- CreateIndex
CREATE INDEX "procedimentos_pf_upload_id_idx" ON "procedimentos_pf"("upload_id");

-- CreateIndex
CREATE UNIQUE INDEX "procedimentos_pf_data_referencia_cpf_procedimento_unidade_key" ON "procedimentos_pf"("data_referencia", "cpf", "procedimento", "unidade");

-- CreateIndex
CREATE INDEX "comissoes_parceiros_parceiro_id_idx" ON "comissoes_parceiros"("parceiro_id");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_parceiros_parceiro_id_mes_referencia_key" ON "comissoes_parceiros"("parceiro_id", "mes_referencia");

-- CreateIndex
CREATE UNIQUE INDEX "primeira_acss_token_key" ON "primeira_acss"("token");

-- CreateIndex
CREATE INDEX "primeira_acss_token_idx" ON "primeira_acss"("token");

-- CreateIndex
CREATE INDEX "configuracoes_pontos_gestor_pf_id_idx" ON "configuracoes_pontos"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "configuracoes_pontos_vigente_desde_idx" ON "configuracoes_pontos"("vigente_desde");

-- CreateIndex
CREATE INDEX "ciclos_pontos_gestor_pf_id_status_idx" ON "ciclos_pontos"("gestor_pf_id", "status");

-- CreateIndex
CREATE INDEX "ciclos_pontos_gestor_pf_id_idx" ON "ciclos_pontos"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "ciclos_pontos_status_idx" ON "ciclos_pontos"("status");

-- CreateIndex
CREATE INDEX "movimentacoes_pontos_parceiro_id_idx" ON "movimentacoes_pontos"("parceiro_id");

-- CreateIndex
CREATE INDEX "movimentacoes_pontos_ciclo_pontos_id_idx" ON "movimentacoes_pontos"("ciclo_pontos_id");

-- CreateIndex
CREATE INDEX "movimentacoes_pontos_origem_idx" ON "movimentacoes_pontos"("origem");

-- CreateIndex
CREATE INDEX "movimentacoes_pontos_referencia_procedimento_id_idx" ON "movimentacoes_pontos"("referencia_procedimento_id");

-- CreateIndex
CREATE INDEX "movimentacoes_pontos_referencia_solicitacao_resgate_id_idx" ON "movimentacoes_pontos"("referencia_solicitacao_resgate_id");

-- CreateIndex
CREATE INDEX "ranking_snapshots_ciclo_pontos_id_idx" ON "ranking_snapshots"("ciclo_pontos_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshots_ciclo_pontos_id_referencia_mes_key" ON "ranking_snapshots"("ciclo_pontos_id", "referencia_mes");

-- CreateIndex
CREATE INDEX "ranking_posicoes_ranking_snapshot_id_idx" ON "ranking_posicoes"("ranking_snapshot_id");

-- CreateIndex
CREATE INDEX "ranking_posicoes_parceiro_id_idx" ON "ranking_posicoes"("parceiro_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_posicoes_ranking_snapshot_id_parceiro_id_key" ON "ranking_posicoes"("ranking_snapshot_id", "parceiro_id");

-- CreateIndex
CREATE INDEX "premios_gestor_pf_id_idx" ON "premios"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "premios_ativo_idx" ON "premios"("ativo");

-- CreateIndex
CREATE INDEX "solicitacoes_resgate_parceiro_id_idx" ON "solicitacoes_resgate"("parceiro_id");

-- CreateIndex
CREATE INDEX "solicitacoes_resgate_premio_id_idx" ON "solicitacoes_resgate"("premio_id");

-- CreateIndex
CREATE INDEX "solicitacoes_resgate_ciclo_pontos_id_idx" ON "solicitacoes_resgate"("ciclo_pontos_id");

-- CreateIndex
CREATE INDEX "solicitacoes_resgate_status_idx" ON "solicitacoes_resgate"("status");

-- AddForeignKey
ALTER TABLE "gestores_pf" ADD CONSTRAINT "gestores_pf_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicados" ADD CONSTRAINT "indicados_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads_planilha_pf" ADD CONSTRAINT "uploads_planilha_pf_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_indicado_id_fkey" FOREIGN KEY ("indicado_id") REFERENCES "indicados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads_planilha_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes_parceiros" ADD CONSTRAINT "comissoes_parceiros_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primeira_acss" ADD CONSTRAINT "primeira_acss_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_ciclo_pontos_id_fkey" FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_ciclo_pontos_id_fkey" FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_posicoes" ADD CONSTRAINT "ranking_posicoes_ranking_snapshot_id_fkey" FOREIGN KEY ("ranking_snapshot_id") REFERENCES "ranking_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_posicoes" ADD CONSTRAINT "ranking_posicoes_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_premio_id_fkey" FOREIGN KEY ("premio_id") REFERENCES "premios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_ciclo_pontos_id_fkey" FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
