-- ============================================================================
-- Migração: gestor-pf → backoffice
-- ============================================================================
-- Este script renomeia todas as tabelas, colunas e constraints relacionadas
-- ao perfil gestor-pf para backoffice, refletindo sua função de administrador
-- técnico/operacional do sistema.
--
-- Execução: psql -U postgres -d asa_db -h localhost -f migrate_gestor_pf_to_backoffice.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Renomear tabelas
-- ============================================================================

-- 1.1. Renomear tabela gestores_pf para backoffices
ALTER TABLE IF EXISTS "gestores_pf" RENAME TO "backoffices";

-- 1.2. Renomear tabela uploads_planilha_pf para uploads_planilha_backoffice
ALTER TABLE IF EXISTS "uploads_planilha_pf" RENAME TO "uploads_planilha_backoffice";

-- ============================================================================
-- 2. Renomear colunas (Foreign Keys)
-- ============================================================================

-- 2.1. Tabela liderancas
ALTER TABLE "liderancas" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.2. Tabela parceiros
ALTER TABLE "parceiros" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.3. Tabela configuracoes_pontos
ALTER TABLE "configuracoes_pontos" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.4. Tabela ciclos_pontos
ALTER TABLE "ciclos_pontos" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.5. Tabela premios
ALTER TABLE "premios" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.6. Tabela regras_comerciais
ALTER TABLE "regras_comerciais" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.7. Tabela regras_gestores
ALTER TABLE "regras_gestores" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 2.8. Tabela uploads_planilha_backoffice (renomeada anteriormente)
ALTER TABLE "uploads_planilha_backoffice" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- ============================================================================
-- 3. Renomear índices
-- ============================================================================

-- 3.1. Índices de backoffices (antigos gestores_pf)
ALTER INDEX IF EXISTS "gestores_pf_usuario_id_key" RENAME TO "backoffices_usuario_id_key";
ALTER INDEX IF EXISTS "gestores_pf_cpf_key" RENAME TO "backoffices_cpf_key";

-- 3.2. Índices de foreign keys
ALTER INDEX IF EXISTS "parceiros_gestor_pf_id_idx" RENAME TO "parceiros_backoffice_id_idx";
ALTER INDEX IF EXISTS "configuracoes_pontos_gestor_pf_id_idx" RENAME TO "configuracoes_pontos_backoffice_id_idx";
ALTER INDEX IF EXISTS "ciclos_pontos_gestor_pf_id_idx" RENAME TO "ciclos_pontos_backoffice_id_idx";
ALTER INDEX IF EXISTS "ciclos_pontos_gestor_pf_id_status_idx" RENAME TO "ciclos_pontos_backoffice_id_status_idx";
ALTER INDEX IF EXISTS "premios_gestor_pf_id_idx" RENAME TO "premios_backoffice_id_idx";
ALTER INDEX IF EXISTS "regras_comerciais_gestor_pf_id_idx" RENAME TO "regras_comerciais_backoffice_id_idx";
ALTER INDEX IF EXISTS "regras_gestores_gestor_pf_id_idx" RENAME TO "regras_gestores_backoffice_id_idx";
ALTER INDEX IF EXISTS "uploads_planilha_pf_gestor_pf_id_idx" RENAME TO "uploads_planilha_backoffice_backoffice_id_idx";

-- 3.3. Índices únicos
ALTER INDEX IF EXISTS "regras_comerciais_gestor_pf_id_key" RENAME TO "regras_comerciais_backoffice_id_key";
ALTER INDEX IF EXISTS "regras_gestores_gestor_pf_id_key" RENAME TO "regras_gestores_backoffice_id_key";

-- ============================================================================
-- 4. Renomear constraints
-- ============================================================================

-- 4.1. Constraints únicas da tabela backoffices
ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_pkey" TO "backoffices_pkey";
ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_usuario_id_key" TO "backoffices_usuario_id_key";
ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_cpf_key" TO "backoffices_cpf_key";

-- 4.2. Constraints únicas da tabela uploads_planilha_backoffice
ALTER TABLE "uploads_planilha_backoffice" RENAME CONSTRAINT "uploads_planilha_pf_pkey" TO "uploads_planilha_backoffice_pkey";

-- ============================================================================
-- 5. Recriar Foreign Key Constraints
-- ============================================================================

-- 5.1. liderancas -> backoffices
ALTER TABLE "liderancas" DROP CONSTRAINT IF EXISTS "liderancas_gestor_pf_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.2. parceiros -> backoffices
ALTER TABLE "parceiros" DROP CONSTRAINT IF EXISTS "parceiros_gestor_pf_id_fkey";
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.3. configuracoes_pontos -> backoffices
ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_gestor_pf_id_fkey";
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.4. ciclos_pontos -> backoffices
ALTER TABLE "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_gestor_pf_id_fkey";
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.5. premios -> backoffices
ALTER TABLE "premios" DROP CONSTRAINT IF EXISTS "premios_gestor_pf_id_fkey";
ALTER TABLE "premios" ADD CONSTRAINT "premios_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.6. regras_comerciais -> backoffices
ALTER TABLE "regras_comerciais" DROP CONSTRAINT IF EXISTS "regras_comerciais_gestor_pf_id_fkey";
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.7. regras_gestores -> backoffices
ALTER TABLE "regras_gestores" DROP CONSTRAINT IF EXISTS "regras_gestores_gestor_pf_id_fkey";
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.8. uploads_planilha_backoffice -> backoffices
ALTER TABLE "uploads_planilha_backoffice" DROP CONSTRAINT IF EXISTS "uploads_planilha_pf_gestor_pf_id_fkey";
ALTER TABLE "uploads_planilha_backoffice" ADD CONSTRAINT "uploads_planilha_backoffice_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.9. backoffices -> usuarios
ALTER TABLE "backoffices" DROP CONSTRAINT IF EXISTS "gestores_pf_usuario_id_fkey";
ALTER TABLE "backoffices" ADD CONSTRAINT "backoffices_usuario_id_fkey" 
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 6. Adicionar novo tipo ao enum (se necessário)
-- ============================================================================

-- 6.1. Adicionar BACKOFFICE ao enum TipoUsuario
-- Nota: PostgreSQL não permite verificar se valor existe no enum antes de adicionar
-- Em produção, execute apenas uma vez
DO $$ BEGIN
  ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'BACKOFFICE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 6.2. Opcional: Adicionar ao enum PapelGestor se for manter
-- DO $$ BEGIN
--   ALTER TYPE "PapelGestor" ADD VALUE IF NOT EXISTS 'BACKOFFICE';
-- EXCEPTION
--   WHEN duplicate_object THEN null;
-- END $$;

-- ============================================================================
-- 7. Atualizar dados existentes (opcional - apenas para consistência)
-- ============================================================================

-- 7.1. Atualizar usuários que tinham tipo GESTOR e papel GESTOR_PF
-- NOTA: Isso depende da estratégia adotada. Se for manter tipo GESTOR com papel BACKOFFICE,
-- descomente as linhas abaixo:
-- UPDATE "usuarios" 
-- SET "papel" = 'BACKOFFICE' 
-- WHERE "papel" = 'GESTOR_PF';

-- 7.2. Ou, se for criar usuários com tipo BACKOFFICE diretamente:
-- Isso será feito no seed/insert inicial, não nesta migração

-- ============================================================================
-- 8. Validação
-- ============================================================================

-- 8.1. Verificar se todas as tabelas foram renomeadas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('gestores_pf', 'uploads_planilha_pf');
  
  IF table_count > 0 THEN
    RAISE EXCEPTION 'Erro: Tabelas antigas ainda existem!';
  END IF;
  
  RAISE NOTICE '✓ Tabelas renomeadas com sucesso';
END $$;

-- 8.2. Verificar se novas tabelas existem
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('backoffices', 'uploads_planilha_backoffice');
  
  IF table_count < 2 THEN
    RAISE EXCEPTION 'Erro: Novas tabelas não foram criadas!';
  END IF;
  
  RAISE NOTICE '✓ Novas tabelas criadas com sucesso';
END $$;

-- 8.3. Verificar se foreign keys foram recriadas
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count 
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%backoffice%';
  
  IF fk_count < 8 THEN
    RAISE EXCEPTION 'Erro: Foreign keys não foram recriadas corretamente!';
  END IF;
  
  RAISE NOTICE '✓ Foreign keys recriadas com sucesso';
END $$;

-- ============================================================================
-- 9. Commit
-- ============================================================================

COMMIT;

-- ============================================================================
-- Fim da migração
-- ============================================================================
-- 
-- Próximos passos:
-- 1. Atualizar o Prisma schema (packages/database/prisma/schema.prisma)
-- 2. Rodar: npx prisma generate
-- 3. Rodar: npx prisma db pull (para sincronizar com o banco)
-- 4. Atualizar código TypeScript/JavaScript
-- 5. Testar todas as funcionalidades
-- 
-- Rollback (em caso de erro):
-- Execute o script: rollback_migrate_gestor_pf_to_backoffice.sql
-- ============================================================================