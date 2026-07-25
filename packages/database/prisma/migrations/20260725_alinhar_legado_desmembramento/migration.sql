-- Migration: 20260725_alinhar_legado_desmembramento
-- Aligns the existing Neon database (schema from the legacy pre-split system)
-- to the current schema.prisma of the desmembramento (gestor/consultor/estabelecimento).
--
-- Strategy: temporarily relax the usuarios.tipo column to TEXT, remap legacy
-- values to the post-split variant set, then re-tighten the column to a
-- freshly created TipoUsuario enum with only the post-split variants.
-- Avoids the PG restriction that ADD VALUE cannot be used in-transaction.

-- 1) Drop FK on documentos.estabelecimento_id to swap ON DELETE behavior
ALTER TABLE "documentos" DROP CONSTRAINT IF EXISTS "documentos_estabelecimento_id_fkey";

-- 2) Drop legacy relationship columns from usuarios (no longer in schema.prisma)
ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "gestor_id";
ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "lideranca_id";
ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "papel";

-- 3) Drop the now-unused PapelGestor enum (no column references it anymore)
DROP TYPE IF EXISTS "public"."PapelGestor";

-- 4) Relax usuarios.tipo to TEXT so we can re-map arbitrary old values.
ALTER TABLE "usuarios" ALTER COLUMN "tipo" TYPE TEXT USING ("tipo"::text);

-- 5) Re-map legacy tipo values to the post-split variant set.
--    All GESTOR_* become GESTOR_PJ; PARCEIRO/COMERCIAL become CONSULTOR.
UPDATE "usuarios" SET "tipo" = 'GESTOR_PJ' WHERE "tipo" = 'GESTOR';
UPDATE "usuarios" SET "tipo" = 'GESTOR_PJ' WHERE "tipo" = 'GESTOR_PF';
UPDATE "usuarios" SET "tipo" = 'GESTOR_PJ' WHERE "tipo" = 'GESTOR_PJ';
UPDATE "usuarios" SET "tipo" = 'CONSULTOR' WHERE "tipo" = 'PARCEIRO';
UPDATE "usuarios" SET "tipo" = 'CONSULTOR' WHERE "tipo" = 'COMERCIAL';
-- Defensive: any other value falls back to CONSULTOR.
UPDATE "usuarios" SET "tipo" = 'CONSULTOR'
WHERE "tipo" NOT IN ('ADMIN', 'CONSULTOR', 'GESTOR_PJ');

-- 6) Create the new TipoUsuario enum with only the post-split variants.
CREATE TYPE "TipoUsuario_new" AS ENUM ('ADMIN', 'CONSULTOR', 'GESTOR_PJ');

-- 7) Tighten usuarios.tipo back to the new enum.
ALTER TABLE "usuarios"
  ALTER COLUMN "tipo" TYPE "TipoUsuario_new"
  USING ("tipo"::text::"TipoUsuario_new");

-- 8) Swap the type name: rename old, promote new, drop old.
ALTER TYPE "TipoUsuario" RENAME TO "TipoUsuario_old";
ALTER TYPE "TipoUsuario_new" RENAME TO "TipoUsuario";
DROP TYPE "public"."TipoUsuario_old";

-- 9) Recreate documentos.estabelecimento_id FK with ON DELETE CASCADE
ALTER TABLE "documentos"
  ADD CONSTRAINT "documentos_estabelecimento_id_fkey"
  FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
