-- Migration SQL para produção (Neon)
-- Executar manualmente no banco de produção após revisão

-- 1. Backup dos dados (opcional, mas recomendado)
-- CREATE TABLE comissoes_parceiros_backup AS SELECT * FROM comissoes_parceiros;
-- CREATE TABLE parceiros_backup AS SELECT * FROM parceiros;

-- 2. Remover índices
DROP INDEX IF EXISTS "comissoes_parceiros_parceiro_id_idx";
DROP INDEX IF EXISTS "comissoes_parceiros_parceiro_id_mes_referencia_key";

-- 3. Remover tabela comissoes_parceiros
DROP TABLE IF EXISTS "comissoes_parceiros";

-- 4. Remover coluna percentual_comissao da tabela parceiros
ALTER TABLE "parceiros" DROP COLUMN IF EXISTS "percentual_comissao";

-- Fim da migration