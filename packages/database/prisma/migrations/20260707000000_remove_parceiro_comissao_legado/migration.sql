-- DropIndex: Remove índice da tabela comissoes_parceiros
DROP INDEX IF EXISTS "comissoes_parceiros_parceiro_id_idx";

-- DropIndex: Remove índice único da tabela comissoes_parceiros
DROP INDEX IF EXISTS "comissoes_parceiros_parceiro_id_mes_referencia_key";

-- DropTable: Remove tabela comissoes_parceiros
DROP TABLE IF EXISTS "comissoes_parceiros";

-- AlterTable: Remove coluna percentual_comissao da tabela parceiros
ALTER TABLE "parceiros" DROP COLUMN IF EXISTS "percentual_comissao";