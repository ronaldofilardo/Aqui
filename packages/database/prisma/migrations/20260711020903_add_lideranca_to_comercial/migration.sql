/*
  Warnings:

  - The `status` column on the `gestores` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `liderancas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `gestor_id` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `lideranca_id` on the `usuarios` table. All the data in the column will be lost.
  - Made the column `lideranca_id` on table `comerciais` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `tipo` on the `liderancas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoLideranca" AS ENUM ('COMERCIAL', 'GESTOR');

-- AlterEnum
ALTER TYPE "TipoUsuario" ADD VALUE 'LIDERANCA';

-- DropForeignKey
ALTER TABLE "comerciais" DROP CONSTRAINT "comerciais_lideranca_id_fkey";

-- DropForeignKey
ALTER TABLE "gestores" DROP CONSTRAINT "gestores_lideranca_id_fkey";

-- DropForeignKey
ALTER TABLE "gestores" DROP CONSTRAINT "gestores_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "liderancas" DROP CONSTRAINT "liderancas_gestor_pf_id_fkey";

-- DropForeignKey
ALTER TABLE "liderancas" DROP CONSTRAINT "liderancas_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "parceiros" DROP CONSTRAINT "parceiros_comercial_id_fkey";

-- DropForeignKey
ALTER TABLE "parceiros" DROP CONSTRAINT "parceiros_gestor_id_fkey";

-- DropForeignKey
ALTER TABLE "procedimentos_pf" DROP CONSTRAINT "procedimentos_pf_gestor_id_fkey";

-- AlterTable
ALTER TABLE "comerciais" ADD COLUMN     "tipoLideranca" "TipoLideranca",
ALTER COLUMN "lideranca_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "gestores" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO';

-- AlterTable
ALTER TABLE "liderancas" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoLideranca" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO';

-- AlterTable
ALTER TABLE "primeira_acss" ALTER COLUMN "parceiro_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "gestor_id",
DROP COLUMN "lideranca_id";

-- CreateIndex
CREATE INDEX "liderancas_tipo_idx" ON "liderancas"("tipo");

-- AddForeignKey
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_comercial_id_fkey" FOREIGN KEY ("comercial_id") REFERENCES "comerciais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
