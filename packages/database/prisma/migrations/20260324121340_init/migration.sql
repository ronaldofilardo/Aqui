-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('GESTOR', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoPix" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CNPJ', 'CPF_RESPONSAVEL');

-- CreateEnum
CREATE TYPE "StatusCupom" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusCupomImportado" AS ENUM ('DISPONIVEL', 'USADO', 'CANCELADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "StatusConsulta" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "StatusPagamentoComissao" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "telefone" VARCHAR(20),
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultores" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "pix_chave" VARCHAR(100),
    "pix_tipo" "TipoPix",
    "banco_nome" VARCHAR(100),
    "agencia" VARCHAR(10),
    "conta" VARCHAR(20),
    "total_consultas" INTEGER NOT NULL DEFAULT 0,
    "total_comissoes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estabelecimentos" (
    "id" UUID NOT NULL,
    "consultor_id" UUID NOT NULL,
    "nome_fantasia" VARCHAR(255) NOT NULL,
    "razao_social" VARCHAR(255),
    "cnpj" VARCHAR(20),
    "endereco" TEXT,
    "cidade" VARCHAR(100),
    "estado" VARCHAR(2),
    "telefone" VARCHAR(20),
    "email" VARCHAR(255),
    "responsavel_nome" VARCHAR(255),
    "responsavel_cpf" VARCHAR(14),
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estabelecimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "url_arquivo" TEXT NOT NULL,
    "nome_original" VARCHAR(255),
    "tamanho_bytes" INTEGER,
    "mimetype" VARCHAR(100),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupons_config" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "codigo_cupom" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(255),
    "status" "StatusCupom" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" UUID NOT NULL,

    CONSTRAINT "cupons_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupons_importados" (
    "id" UUID NOT NULL,
    "cupom_config_id" UUID NOT NULL,
    "paciente_nome" VARCHAR(255) NOT NULL,
    "paciente_cpf" VARCHAR(14),
    "campanha" VARCHAR(100) NOT NULL DEFAULT 'Acesso Saude Aqui',
    "servico" VARCHAR(50) NOT NULL DEFAULT 'Cupom',
    "preco_original" DECIMAL(10,2) NOT NULL,
    "desconto_percentual" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "preco_final" DECIMAL(10,2) NOT NULL,
    "status" "StatusCupomImportado" NOT NULL DEFAULT 'DISPONIVEL',
    "consulta_id" UUID,
    "usado_em" TIMESTAMP(3),
    "mes_referencia" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupons_importados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" UUID NOT NULL,
    "cupom_importado_id" UUID NOT NULL,
    "data_agendamento" TIMESTAMP(3),
    "data_realizacao" TIMESTAMP(3),
    "status" "StatusConsulta" NOT NULL,
    "valor_pago" DECIMAL(10,2),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" UUID NOT NULL,
    "consulta_id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "consultor_id" UUID NOT NULL,
    "valor_estabelecimento" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "valor_consultor" DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    "mes_referencia" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "status_pagamento" "StatusPagamentoComissao" NOT NULL DEFAULT 'PENDENTE',
    "data_pagamento" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" UUID NOT NULL,
    "consultor_id" UUID NOT NULL,
    "mes_referencia" INTEGER NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "quantidade_consultas" INTEGER NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "pix_txid" VARCHAR(100),
    "data_pagamento" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pago_em" TIMESTAMP(3),

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "acao" VARCHAR(100) NOT NULL,
    "entidade" VARCHAR(100) NOT NULL,
    "entidade_id" UUID,
    "detalhes" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "consultores_usuario_id_key" ON "consultores"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "cupons_config_estabelecimento_id_key" ON "cupons_config"("estabelecimento_id");

-- CreateIndex
CREATE UNIQUE INDEX "cupons_config_codigo_cupom_key" ON "cupons_config"("codigo_cupom");

-- CreateIndex
CREATE INDEX "cupons_importados_status_idx" ON "cupons_importados"("status");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_cupom_importado_id_key" ON "consultas"("cupom_importado_id");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_consulta_id_key" ON "comissoes"("consulta_id");

-- CreateIndex
CREATE INDEX "comissoes_mes_referencia_ano_referencia_idx" ON "comissoes"("mes_referencia", "ano_referencia");

-- CreateIndex
CREATE INDEX "comissoes_consultor_id_idx" ON "comissoes"("consultor_id");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- AddForeignKey
ALTER TABLE "consultores" ADD CONSTRAINT "consultores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estabelecimentos" ADD CONSTRAINT "estabelecimentos_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "consultores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupons_config" ADD CONSTRAINT "cupons_config_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupons_config" ADD CONSTRAINT "cupons_config_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupons_importados" ADD CONSTRAINT "cupons_importados_cupom_config_id_fkey" FOREIGN KEY ("cupom_config_id") REFERENCES "cupons_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_cupom_importado_id_fkey" FOREIGN KEY ("cupom_importado_id") REFERENCES "cupons_importados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "consultores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "consultores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
