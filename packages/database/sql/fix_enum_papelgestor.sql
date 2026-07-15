-- ============================================================================
-- Correção do Enum PapelGestor
-- ============================================================================
-- Adiciona BACKOFFICE ao enum PapelGestor
-- Execução: psql -U postgres -d asa_db -h localhost -f fix_enum_papelgestor.sql
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE "PapelGestor" ADD VALUE IF NOT EXISTS 'BACKOFFICE';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'BACKOFFICE já existe no enum PapelGestor';
END $$;

-- Verificar
SELECT unnest(enum_range(NULL::"PapelGestor")) as valores;

RAISE NOTICE 'Enum PapelGestor atualizado com sucesso!';