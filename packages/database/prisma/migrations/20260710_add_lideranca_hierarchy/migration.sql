-- CreateTable
CREATE TABLE "liderancas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "gestor_pf_id" UUID NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liderancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "lideranca_id" UUID NOT NULL,
    "percentual_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liderancas_usuario_id_key" ON "liderancas"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "liderancas_cpf_key" ON "liderancas"("cpf");

-- CreateIndex
CREATE INDEX "liderancas_gestor_pf_id_idx" ON "liderancas"("gestor_pf_id");

-- CreateIndex
CREATE INDEX "liderancas_tipo_idx" ON "liderancas"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "gestores_usuario_id_key" ON "gestores"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "gestores_cpf_key" ON "gestores"("cpf");

-- CreateIndex
CREATE INDEX "gestores_lideranca_id_idx" ON "gestores"("lideranca_id");

-- AddForeignKey
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE CASCADE;

-- AlterTable - Add columns to usuarios
ALTER TABLE "usuarios" ADD COLUMN "lideranca_id" UUID;
ALTER TABLE "usuarios" ADD COLUMN "gestor_id" UUID;

-- AlterTable - Change comerciais to use lideranca_id
ALTER TABLE "comerciais" ADD COLUMN "lideranca_id" UUID;
ALTER TABLE "comerciais" DROP CONSTRAINT IF EXISTS "comerciais_gestor_pf_id_fkey";
ALTER TABLE "comerciais" DROP COLUMN "gestor_pf_id";
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE CASCADE;
CREATE INDEX "comerciais_lideranca_id_idx" ON "comerciais"("lideranca_id");

-- AlterTable - Add columns to parceiros
ALTER TABLE "parceiros" ADD COLUMN "comercial_id" UUID;
ALTER TABLE "parceiros" ADD COLUMN "gestor_id" UUID;
ALTER TABLE "parceiros" DROP CONSTRAINT IF EXISTS "parceiros_gestor_pf_id_fkey";
ALTER TABLE "parceiros" DROP COLUMN "gestor_pf_id";
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_comercial_id_fkey" FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id");
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id");
CREATE INDEX "parceiros_comercial_id_idx" ON "parceiros"("comercial_id");
CREATE INDEX "parceiros_gestor_id_idx" ON "parceiros"("gestor_id");

-- AlterTable - Add columns to procedimentos_pf
ALTER TABLE "procedimentos_pf" ADD COLUMN "gestor_id" UUID;
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id");
CREATE INDEX "procedimentos_pf_gestor_id_idx" ON "procedimentos_pf"("gestor_id");

-- AlterTable - Change gestores_pf relations
ALTER TABLE "gestores_pf" DROP CONSTRAINT IF EXISTS "gestores_pf_comerciais_fkey";
ALTER TABLE "gestores_pf" DROP CONSTRAINT IF EXISTS "gestores_pf_parceiros_fkey";