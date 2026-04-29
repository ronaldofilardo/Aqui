-- CreateTable gestores_consultores
CREATE TABLE "gestores_consultores" (
    "id" UUID NOT NULL,
    "gestor_id" UUID NOT NULL,
    "consultor_id" UUID NOT NULL,
    "atribuido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gestores_consultores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestores_consultores_gestor_id_consultor_id_key" ON "gestores_consultores"("gestor_id", "consultor_id");

-- CreateIndex
CREATE INDEX "gestores_consultores_gestor_id_idx" ON "gestores_consultores"("gestor_id");

-- CreateIndex
CREATE INDEX "gestores_consultores_consultor_id_idx" ON "gestores_consultores"("consultor_id");

-- AddForeignKey
ALTER TABLE "gestores_consultores" ADD CONSTRAINT "gestores_consultores_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores_consultores" ADD CONSTRAINT "gestores_consultores_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "consultores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
