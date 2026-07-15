-- Renomear constraints únicas
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_usuario_id_key') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_usuario_id_key" TO "backoffices_usuario_id_key";
    RAISE NOTICE 'OK: gestores_pf_usuario_id_key -> backoffices_usuario_id_key';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_cpf_key') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_cpf_key" TO "backoffices_cpf_key";
    RAISE NOTICE 'OK: gestores_pf_cpf_key -> backoffices_cpf_key';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uploads_planilha_pf_pkey') THEN
    ALTER TABLE "uploads_planilha_backoffice" RENAME CONSTRAINT "uploads_planilha_pf_pkey" TO "uploads_planilha_backoffice_pkey";
    RAISE NOTICE 'OK: uploads_planilha_pf_pkey -> uploads_planilha_backoffice_pkey';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'gestores_pf_pkey') THEN
    ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_pkey" TO "backoffices_pkey";
    RAISE NOTICE 'OK: gestores_pf_pkey -> backoffices_pkey';
  END IF;
END $$;

RAISE NOTICE 'Migração BACKOFFICE concluída com sucesso!';