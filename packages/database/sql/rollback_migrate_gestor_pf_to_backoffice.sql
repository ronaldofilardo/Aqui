-- ============================================================================
-- Rollback: backoffice → gestor-pf
-- ============================================================================
-- Este script reverte a migração backoffice para gestor-pf.
-- Use APENAS em caso de erro crítico na migração original.
--
-- Execução: psql -U postgres -d asa_db -h localhost -f rollback_migrate_gestor_pf_to_backoffice.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Recriar Foreign Key Constraints originais
-- ============================================================================

-- 1.1. liderancas -> gestores_pf
ALTER TABLE "liderancas" DROP CONSTRAINT IF EXISTS "liderancas_backoffice_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.2. parceiros -> gestores_pf
ALTER TABLE "parceiros" DROP CONSTRAINT IF EXISTS "parceiros_backoffice_id_fkey";
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.3. configuracoes_pontos -> gestores_pf
ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_backoffice_id_fkey";
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.4. ciclos_pontos -> gestores_pf
ALTER TABLE "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_backoffice_id_fkey";
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.5. premios -> gestores_pf
ALTER TABLE "premios" DROP CONSTRAINT IF EXISTS "premios_backoffice_id_fkey";
ALTER TABLE "premios" ADD CONSTRAINT "premios_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.6. regras_comerciais -> gestores_pf
ALTER TABLE "regras_comerciais" DROP CONSTRAINT IF EXISTS "regras_comerciais_backoffice_id_fkey";
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.7. regras_gestores -> gestores_pf
ALTER TABLE "regras_gestores" DROP CONSTRAINT IF EXISTS "regras_gestores_backoffice_id_fkey";
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.8. uploads_planilha_pf -> gestores_pf
ALTER TABLE "uploads_planilha_pf" DROP CONSTRAINT IF EXISTS "uploads_planilha_backoffice_backoffice_id_fkey";
ALTER TABLE "uploads_planilha_pf" ADD CONSTRAINT "uploads_planilha_pf_gestor_pf_id_fkey" 
  FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.9. gestores_pf -> usuarios
ALTER TABLE "gestores_pf" DROP CONSTRAINT IF EXISTS "backoffices_usuario_id_fkey";
ALTER TABLE "gestores_pf" ADD CONSTRAINT "gestores_pf_usuario_id_fkey" 
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 2. Renomear colunas de volta para gestor_pf_id
-- ============================================================================

ALTER TABLE "liderancas" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "parceiros" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "configuracoes_pontos" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "ciclos_pontos" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "premios" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "regras_comerciais" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "regras_gestores" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";
ALTER TABLE "uploads_planilha_pf" RENAME COLUMN "backoffice_id" TO "gestor_pf_id";

-- ============================================================================
-- 3. Renomear índices de volta
-- ============================================================================

ALTER INDEX IF EXISTS "backoffices_usuario_id_key" RENAME TO "gestores_pf_usuario_id_key";
ALTER INDEX IF EXISTS "backoffices_cpf_key" RENAME TO "gestores_pf_cpf_key";
ALTER INDEX IF EXISTS "parceiros_backoffice_id_idx" RENAME TO "parceiros_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "configuracoes_pontos_backoffice_id_idx" RENAME TO "configuracoes_pontos_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "ciclos_pontos_backoffice_id_idx" RENAME TO "ciclos_pontos_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "ciclos_pontos_backoffice_id_status_idx" RENAME TO "ciclos_pontos_gestor_pf_id_status_idx";
ALTER INDEX IF EXISTS "premios_backoffice_id_idx" RENAME TO "premios_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "regras_comerciais_backoffice_id_idx" RENAME TO "regras_comerciais_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "regras_gestores_backoffice_id_idx" RENAME TO "regras_gestores_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "uploads_planilha_backoffice_backoffice_id_idx" RENAME TO "uploads_planilha_pf_gestor_pf_id_idx";
ALTER INDEX IF EXISTS "regras_comerciais_backoffice_id_key" RENAME TO "regras_comerciais_gestor_pf_id_key";
ALTER INDEX IF EXISTS "regras_gestores_backoffice_id_key" RENAME TO "regras_gestores_gestor_pf_id_key";

-- ============================================================================
-- 4. Renomear constraints de volta
-- ============================================================================

ALTER TABLE "gestores_pf" RENAME CONSTRAINT "backoffices_pkey" TO "gestores_pf_pkey";
ALTER TABLE "gestores_pf" RENAME CONSTRAINT "backoffices_usuario_id_key" TO "gestores_pf_usuario_id_key";
ALTER TABLE "gestores_pf" RENAME CONSTRAINT "backoffices_cpf_key" TO "gestores_pf_cpf_key";
ALTER TABLE "uploads_planilha_pf" RENAME CONSTRAINT "uploads_planilha_backoffice_pkey" TO "uploads_planilha_pf_pkey";

-- ============================================================================
-- 5. Renomear tabelas de volta
-- ============================================================================

ALTER TABLE IF EXISTS "backoffices" RENAME TO "gestores_pf";
ALTER TABLE IF EXISTS "uploads_planilha_backoffice" RENAME TO "uploads_planilha_pf";

-- ============================================================================
-- 6. Validação
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('gestores_pf', 'uploads_planilha_pf');
  
  IF table_count < 2 THEN
    RAISE EXCEPTION 'Erro: Rollback falhou - tabelas originais não existem!';
  END IF;
  
  RAISE NOTICE '✓ Rollback concluído com sucesso - tabelas originais restauradas';
END $$;

COMMIT;

-- ============================================================================
-- Fim do rollback
-- ============================================================================