/*
  Warnings:

  - The `pix_tipo` column on the `estabelecimentos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "estabelecimentos" DROP COLUMN "pix_tipo",
ADD COLUMN     "pix_tipo" "TipoPix";

-- AlterTable
ALTER TABLE "usuarios_estabelecimentos" ALTER COLUMN "id" DROP DEFAULT;
