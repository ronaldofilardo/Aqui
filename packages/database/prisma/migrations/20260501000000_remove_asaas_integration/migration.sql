-- Migration: Remove Asaas payment gateway integration
-- Removes tables: comissoes, pagamentos
-- Removes column: consultores.total_comissoes
-- Removes enums: StatusPagamentoComissao, StatusPagamento

-- Drop comissoes first (references consultas, consultores, estabelecimentos)
DROP TABLE IF EXISTS "comissoes";

-- Drop pagamentos (references consultores)
DROP TABLE IF EXISTS "pagamentos";

-- Remove denormalized commission total from consultores
ALTER TABLE "consultores" DROP COLUMN IF EXISTS "total_comissoes";

-- Drop enums (now unused after tables are gone)
DROP TYPE IF EXISTS "StatusPagamentoComissao";
DROP TYPE IF EXISTS "StatusPagamento";
