-- ============================================================================
-- Migração: gestor-pf → backoffice (VERSÃO SIMPLIFICADA)
-- ============================================================================
-- Executa passo a passo sem transação para facilitar debug
-- ============================================================================

-- 1. Renomear tabelas (se existirem)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gestores_pf') THEN
    ALTER TABLE "gestores_pf" RENAME TO "backoffices";
    RAISE NOTICE 'OK: gestores_pf -> backoffices';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uploads_planilha_pf') THEN
    ALTER TABLE "uploads_planilha_pf" RENAME TO "uploads_planilha_backoffice";
    RAISE NOTICE 'OK: uploads_planilha_pf -> uploads_planilha_backoffice';
  END IF;
END $$;

-- 2. Renomear colunas (apenas se existirem)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'liderancas' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "liderancas" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: liderancas.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'configuracoes_pontos' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "configuracoes_pontos" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: configuracoes_pontos.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ciclos_pontos' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "ciclos_pontos" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: ciclos_pontos.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'premios' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "premios" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: premios.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regras_comerciais' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "regras_comerciais" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: regras_comerciais.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regras_gestores' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "regras_gestores" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: regras_gestores.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uploads_planilha_backoffice' AND column_name = 'gestor_pf_id') THEN
    ALTER TABLE "uploads_planilha_backoffice" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    RAISE NOTICE 'OK: uploads_planilha_backoffice.gestor_pf_id -> backoffice_id';
  END IF;
END $$;

-- 3. Dropar FKs antigas e criar novas
ALTER TABLE "liderancas" DROP CONSTRAINT IF EXISTS "liderancas_gestor_pf_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_gestor_pf_id_fkey";
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_gestor_pf_id_fkey";
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "premios" DROP CONSTRAINT IF EXISTS "premios_gestor_pf_id_fkey";
ALTER TABLE "premios" ADD CONSTRAINT "premios_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regras_comerciais" DROP CONSTRAINT IF EXISTS "regras_comerciais_gestor_pf_id_fkey";
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regras_gestores" DROP CONSTRAINT IF EXISTS "regras_gestores_gestor_pf_id_fkey";
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "uploads_planilha_backoffice" DROP CONSTRAINT IF EXISTS "uploads_planilha_pf_gestor_pf_id_fkey";
ALTER TABLE "uploads_planilha_backoffice" ADD CONSTRAINT "uploads_planilha_backoffice_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "backoffices" DROP CONSTRAINT IF EXISTS "gestores_pf_usuario_id_fkey";
ALTER TABLE "backoffices" ADD CONSTRAINT "backoffices_usuario_id_fkey" 
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Adicionar BACKOFFICE ao enum
DO $$ BEGIN
  ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'BACKOFFICE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Renomear índices
ALTER INDEX IF EXISTS "gestores_pf_usuario_id_key" RENAME TO "backoffices_usuario_id_key";
ALTER INDEX IF EXISTS "gestores_pf_cpf_key" RENAME TO "backoffices_cpf_key";
ALTER INDEX IF EXISTS "configuracoes_pontos_gestor_pf_id_idx" RENAME TO "configuracoes_pontos_backoffice_id_idx";
ALTER INDEX IF EXISTS "ciclos_pontos_gestor_pf_id_idx" RENAME TO "ciclos_pontos_backoffice_id_idx";
ALTER INDEX IF EXISTS "ciclos_pontos_gestor_pf_id_status_idx" RENAME TO "ciclos_pontos_backoffice_id_status_idx";
ALTER INDEX IF EXISTS "premios_gestor_pf_id_idx" RENAME TO "premios_backoffice_id_idx";
ALTER INDEX IF EXISTS "regras_comerciais_gestor_pf_id_idx" RENAME TO "regras_comerciais_backoffice_id_idx";
ALTER INDEX IF EXISTS "regras_gestores_gestor_pf_id_idx" RENAME TO "regras_gestores_backoffice_id_idx";
ALTER INDEX IF EXISTS "regras_comerciais_gestor_pf_id_key" RENAME TO "regras_comerciais_backoffice_id_key";
ALTER INDEX IF EXISTS "regras_gestores_gestor_pf_id_key" RENAME TO "regras_gestores_backoffice_id_key";
ALTER INDEX IF EXISTS "uploads_planilha_pf_gestor_pf_id_idx" RENAME TO "uploads_planilha_backoffice_backoffice_id_idx";

-- 6. Renomear constraints únicas (sem IF EXISTS - PostgreSQL não suporta)
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_pkey') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_pkey" TO "backoffices_pkey";
  END IF;
END $$;