-- AddColumn cpf to consultores
ALTER TABLE "consultores" ADD COLUMN "cpf" VARCHAR(14) UNIQUE;

