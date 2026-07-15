-- ============================================================================
-- Migração: gestor-pf → backoffice (VERSÃO CORRIGIDA)
-- ============================================================================
-- Esta versão verifica se as colunas/tabelas existem antes de alterar
-- Execução: psql -U postgres -d asa_db -h localhost -f migrate_gestor_pf_to_backoffice_fixed.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Renomear tabelas (apenas se existirem)
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gestores_pf') THEN
    ALTER TABLE "gestores_pf" RENAME TO "backoffices";
    RAISE NOTICE 'Tabela gestores_pf renomeada para backoffices';
  ELSE
    RAISE NOTICE 'Tabela gestores_pf não existe, pulando...';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uploads_planilha_pf') THEN
    ALTER TABLE "uploads_planilha_pf" RENAME TO "uploads_planilha_backoffice";
    RAISE NOTICE 'Tabela uploads_planilha_pf renomeada para uploads_planilha_backoffice';
  ELSE
    RAISE NOTICE 'Tabela uploads_planilha_pf não existe, pulando...';
  END IF;
END $$;

-- ============================================================================
-- 2. Renomear colunas (apenas se existirem)
-- ============================================================================

-- Função auxiliar para renomear colunas
CREATE OR REPLACE FUNCTION rename_column_if_exists(tbl text, old_col text, new_col text)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = tbl AND column_name = old_col
  ) THEN
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', tbl, old_col, new_col);
    RAISE NOTICE 'Coluna %I.%I renomeada para %I', tbl, old_col, new_col;
  ELSE
    RAISE NOTICE 'Coluna %I.%I não existe, pulando...', tbl, old_col;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Renomear colunas em todas as tabelas
SELECT rename_column_if_exists('liderancas', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('parceiros', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('configuracoes_pontos', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('ciclos_pontos', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('premios', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('regras_comerciais', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('regras_gestores', 'gestor_pf_id', 'backoffice_id');
SELECT rename_column_if_exists('uploads_planilha_backoffice', 'gestor_pf_id', 'backoffice_id');

-- ============================================================================
-- 3. Renomear índices (apenas se existirem)
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'gestores_pf_usuario_id_key') THEN
    ALTER INDEX "gestores_pf_usuario_id_key" RENAME TO "backoffices_usuario_id_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'gestores_pf_cpf_key') THEN
    ALTER INDEX "gestores_pf_cpf_key" RENAME TO "backoffices_cpf_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'parceiros_gestor_pf_id_idx') THEN
    ALTER INDEX "parceiros_gestor_pf_id_idx" RENAME TO "parceiros_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'configuracoes_pontos_gestor_pf_id_idx') THEN
    ALTER INDEX "configuracoes_pontos_gestor_pf_id_idx" RENAME TO "configuracoes_pontos_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ciclos_pontos_gestor_pf_id_idx') THEN
    ALTER INDEX "ciclos_pontos_gestor_pf_id_idx" RENAME TO "ciclos_pontos_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ciclos_pontos_gestor_pf_id_status_idx') THEN
    ALTER INDEX "ciclos_pontos_gestor_pf_id_status_idx" RENAME TO "ciclos_pontos_backoffice_id_status_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'premios_gestor_pf_id_idx') THEN
    ALTER INDEX "premios_gestor_pf_id_idx" RENAME TO "premios_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'regras_comerciais_gestor_pf_id_idx') THEN
    ALTER INDEX "regras_comerciais_gestor_pf_id_idx" RENAME TO "regras_comerciais_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'regras_gestores_gestor_pf_id_idx') THEN
    ALTER INDEX "regras_gestores_gestor_pf_id_idx" RENAME TO "regras_gestores_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uploads_planilha_pf_gestor_pf_id_idx') THEN
    ALTER INDEX "uploads_planilha_pf_gestor_pf_id_idx" RENAME TO "uploads_planilha_backoffice_backoffice_id_idx";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'regras_comerciais_gestor_pf_id_key') THEN
    ALTER INDEX "regras_comerciais_gestor_pf_id_key" RENAME TO "regras_comerciais_backoffice_id_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'regras_gestores_gestor_pf_id_key') THEN
    ALTER INDEX "regras_gestores_gestor_pf_id_key" RENAME TO "regras_gestores_backoffice_id_key";
  END IF;
END $$;

-- ============================================================================
-- 4. Renomear constraints (apenas se existirem)
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_pkey') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_pkey" TO "backoffices_pkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_usuario_id_key') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_usuario_id_key" TO "backoffices_usuario_id_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_cpf_key') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_cpf_key" TO "backoffices_cpf_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uploads_planilha_pf_pkey') THEN
    ALTER TABLE "uploads_planilha_backoffice" RENAME CONSTRAINT "uploads_planilha_pf_pkey" TO "uploads_planilha_backoffice_pkey";
  END IF;
END $$;

-- ============================================================================
-- 5. Recriar Foreign Key Constraints
-- ============================================================================

-- Drop e recria FKs antigas
ALTER TABLE "liderancas" DROP CONSTRAINT IF EXISTS "liderancas_gestor_pf_id_fkey";
ALTER TABLE "liderancas" DROP CONSTRAINT IF EXISTS "liderancas_backoffice_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parceiros" DROP CONSTRAINT IF EXISTS "parceiros_gestor_pf_id_fkey";
ALTER TABLE "parceiros" DROP CONSTRAINT IF EXISTS "parceiros_backoffice_id_fkey";
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_gestor_pf_id_fkey";
ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_backoffice_id_fkey";
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_gestor_pf_id_fkey";
ALTER TABLE "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_backoffice_id_fkey";
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "premios" DROP CONSTRAINT IF EXISTS "premios_gestor_pf_id_fkey";
ALTER TABLE "premios" DROP CONSTRAINT IF EXISTS "premios_backoffice_id_fkey";
ALTER TABLE "premios" ADD CONSTRAINT "premios_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regras_comerciais" DROP CONSTRAINT IF EXISTS "regras_comerciais_gestor_pf_id_fkey";
ALTER TABLE "regras_comerciais" DROP CONSTRAINT IF EXISTS "regras_comerciais_backoffice_id_fkey";
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regras_gestores" DROP CONSTRAINT IF EXISTS "regras_gestores_gestor_pf_id_fkey";
ALTER TABLE "regras_gestores" DROP CONSTRAINT IF EXISTS "regras_gestores_backoffice_id_fkey";
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "uploads_planilha_backoffice" DROP CONSTRAINT IF EXISTS "uploads_planilha_pf_gestor_pf_id_fkey";
ALTER TABLE "uploads_planilha_backoffice" DROP CONSTRAINT IF EXISTS "uploads_planilha_backoffice_backoffice_id_fkey";
ALTER TABLE "uploads_planilha_backoffice" ADD CONSTRAINT "uploads_planilha_backoffice_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "backoffices" DROP CONSTRAINT IF EXISTS "gestores_pf_usuario_id_fkey";
ALTER TABLE "backoffices" DROP CONSTRAINT IF EXISTS "backoffices_usuario_id_fkey";
ALTER TABLE "backoffices" ADD CONSTRAINT "backoffices_usuario_id_fkey" 
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 6. Adicionar BACKOFFICE ao enum TipoUsuario
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'BACKOFFICE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 7. Limpeza
-- ============================================================================

DROP FUNCTION IF EXISTS rename_column_if_exists(text, text, text);

-- ============================================================================
-- 8. Validação
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'backoffices';
  
  IF table_count < 1 THEN
    RAISE EXCEPTION 'Erro: Tabela backoffices não foi criada!';
  END IF;
  
  RAISE NOTICE '✓ Tabela backoffices existe';
END $$;

RAISE NOTICE '========================================';
RAISE NOTICE 'Migração BACKOFFICE concluída!';
RAISE NOTICE '========================================';

COMMIT;