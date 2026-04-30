-- ============================================================================
-- Migration: Enable Row Level Security (Defense in Depth)
-- Date: 2026-04-30
--
-- Strategy:
--   1. Create a least-privilege application role (asa_app) with DML-only
--      permissions. The DB owner / superuser retains full access for
--      migrations and maintenance.
--   2. Enable RLS on all sensitive tables.
--   3. Create permissive policies granting asa_app full row access.
--      Row-level filtering (e.g. gestor scope) is enforced in application
--      code (api-helpers.ts). RLS here acts as an additional security layer
--      that blocks any non-app, non-superuser direct connection.
--
-- NOTE: To activate asa_app, set DATABASE_URL to use this role in each
--       environment (DEV, TEST, PROD) and set a strong password:
--         ALTER ROLE asa_app WITH PASSWORD '<strong-password>';
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Application role
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'asa_app'
  ) THEN
    -- Password placeholder – MUST be changed per environment via:
    --   ALTER ROLE asa_app WITH PASSWORD '...';
    CREATE ROLE asa_app WITH LOGIN PASSWORD 'CHANGE_ME_BEFORE_USE'
      NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER;
  END IF;
END
$$;

-- Grant schema and object permissions (DML only, no DDL)
GRANT USAGE ON SCHEMA public TO asa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO asa_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO asa_app;

-- Ensure future tables created by owner are also accessible to asa_app
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO asa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO asa_app;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS on sensitive tables
-- ---------------------------------------------------------------------------
ALTER TABLE usuarios                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons_config            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons_importados        ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestores_consultores     ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Policies: asa_app role gets full row access.
--    Row-level filtering is the responsibility of the application layer.
--    Any other non-superuser role cannot access rows at all (default DENY).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'usuarios', 'consultores', 'estabelecimentos', 'documentos',
    'cupons_config', 'cupons_importados', 'consultas', 'comissoes',
    'pagamentos', 'audit_logs', 'usuarios_estabelecimentos', 'gestores_consultores'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop if exists (idempotent re-run)
    EXECUTE format('DROP POLICY IF EXISTS asa_app_full_access ON %I', t);
    EXECUTE format(
      'CREATE POLICY asa_app_full_access ON %I AS PERMISSIVE FOR ALL TO asa_app USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END
$$;
