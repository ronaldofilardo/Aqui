-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "usuario_estabelecimento_id" UUID,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_usuario_id_idx" ON "password_reset_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_usuario_estabelecimento_id_idx" ON "password_reset_tokens"("usuario_estabelecimento_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_estabelecimento_id_fkey" FOREIGN KEY ("usuario_estabelecimento_id") REFERENCES "usuarios_estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
