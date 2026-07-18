-- Migration: Fix dangerous ON DELETE CASCADE constraints (actual database schema)
-- Table names match the real database state (gestores_pf, uploads_planilha_pf, etc.)

-- 1. consultores.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "consultores" DROP CONSTRAINT "consultores_usuario_id_fkey";
ALTER TABLE "consultores" ADD CONSTRAINT "consultores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. estabelecimentos.consultor_id -> consultores: CASCADE -> RESTRICT
ALTER TABLE "estabelecimentos" DROP CONSTRAINT "estabelecimentos_consultor_id_fkey";
ALTER TABLE "estabelecimentos" ADD CONSTRAINT "estabelecimentos_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "consultores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. documentos.estabelecimento_id -> estabelecimentos: CASCADE -> RESTRICT
ALTER TABLE "documentos" DROP CONSTRAINT "documentos_estabelecimento_id_fkey";
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. cupons_config.estabelecimento_id -> estabelecimentos: CASCADE -> RESTRICT
ALTER TABLE "cupons_config" DROP CONSTRAINT "cupons_config_estabelecimento_id_fkey";
ALTER TABLE "cupons_config" ADD CONSTRAINT "cupons_config_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. cupons_importados.cupom_config_id -> cupons_config: CASCADE -> RESTRICT
ALTER TABLE "cupons_importados" DROP CONSTRAINT "cupons_importados_cupom_config_id_fkey";
ALTER TABLE "cupons_importados" ADD CONSTRAINT "cupons_importados_cupom_config_id_fkey" FOREIGN KEY ("cupom_config_id") REFERENCES "cupons_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. usuarios_estabelecimentos.estabelecimento_id -> estabelecimentos: CASCADE -> RESTRICT
ALTER TABLE "usuarios_estabelecimentos" DROP CONSTRAINT "usuarios_estabelecimentos_estabelecimento_id_fkey";
ALTER TABLE "usuarios_estabelecimentos" ADD CONSTRAINT "usuarios_estabelecimentos_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. gestores_consultores.gestor_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "gestores_consultores" DROP CONSTRAINT "gestores_consultores_gestor_id_fkey";
ALTER TABLE "gestores_consultores" ADD CONSTRAINT "gestores_consultores_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. gestores_consultores.consultor_id -> consultores: CASCADE -> RESTRICT
ALTER TABLE "gestores_consultores" DROP CONSTRAINT "gestores_consultores_consultor_id_fkey";
ALTER TABLE "gestores_consultores" ADD CONSTRAINT "gestores_consultores_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "consultores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. password_reset_tokens.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_usuario_id_fkey";
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 10. password_reset_tokens.usuario_estabelecimento_id -> usuarios_estabelecimentos: CASCADE -> RESTRICT
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_usuario_estabelecimento_id_fkey";
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_estabelecimento_id_fkey" FOREIGN KEY ("usuario_estabelecimento_id") REFERENCES "usuarios_estabelecimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. gestores_pf.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "gestores_pf" DROP CONSTRAINT "gestores_pf_usuario_id_fkey";
ALTER TABLE "gestores_pf" ADD CONSTRAINT "gestores_pf_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 12. liderancas.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "liderancas" DROP CONSTRAINT "liderancas_gestor_pf_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 13. liderancas.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "liderancas" DROP CONSTRAINT "liderancas_usuario_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 14. gestores.lideranca_id -> liderancas: CASCADE -> RESTRICT
ALTER TABLE "gestores" DROP CONSTRAINT "gestores_lideranca_id_fkey";
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 15. gestores.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "gestores" DROP CONSTRAINT "gestores_usuario_id_fkey";
ALTER TABLE "gestores" ADD CONSTRAINT "gestores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 16. comerciais.lideranca_id -> liderancas: CASCADE -> RESTRICT
ALTER TABLE "comerciais" DROP CONSTRAINT "comerciais_lideranca_id_fkey";
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 17. comerciais.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "comerciais" DROP CONSTRAINT "comerciais_usuario_id_fkey";
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 18. parceiros.usuario_id -> usuarios: CASCADE -> RESTRICT
ALTER TABLE "parceiros" DROP CONSTRAINT "parceiros_usuario_id_fkey";
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 19. indicados.parceiro_id -> parceiros: CASCADE -> RESTRICT
ALTER TABLE "indicados" DROP CONSTRAINT "indicados_parceiro_id_fkey";
ALTER TABLE "indicados" ADD CONSTRAINT "indicados_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 20. uploads_planilha_pf.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "uploads_planilha_pf" DROP CONSTRAINT "uploads_planilha_pf_gestor_pf_id_fkey";
ALTER TABLE "uploads_planilha_pf" ADD CONSTRAINT "uploads_planilha_pf_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 21. primeira_acss.parceiro_id -> parceiros: CASCADE -> SET NULL (parceiro_id is nullable)
ALTER TABLE "primeira_acss" DROP CONSTRAINT "primeira_acss_parceiro_id_fkey";
ALTER TABLE "primeira_acss" ADD CONSTRAINT "primeira_acss_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 22. configuracoes_pontos.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT "configuracoes_pontos_gestor_pf_id_fkey";
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 23. ciclos_pontos.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "ciclos_pontos" DROP CONSTRAINT "ciclos_pontos_gestor_pf_id_fkey";
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 24. movimentacoes_pontos.ciclo_pontos_id -> ciclos_pontos: CASCADE -> RESTRICT
ALTER TABLE "movimentacoes_pontos" DROP CONSTRAINT "movimentacoes_pontos_ciclo_pontos_id_fkey";
ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_ciclo_pontos_id_fkey" FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 25. movimentacoes_pontos.parceiro_id -> parceiros: CASCADE -> RESTRICT
ALTER TABLE "movimentacoes_pontos" DROP CONSTRAINT "movimentacoes_pontos_parceiro_id_fkey";
ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 26. ranking_snapshots.ciclo_pontos_id -> ciclos_pontos: CASCADE -> RESTRICT
ALTER TABLE "ranking_snapshots" DROP CONSTRAINT "ranking_snapshots_ciclo_pontos_id_fkey";
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_ciclo_pontos_id_fkey" FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 27. ranking_posicoes.ranking_snapshot_id -> ranking_snapshots: CASCADE -> RESTRICT
ALTER TABLE "ranking_posicoes" DROP CONSTRAINT "ranking_posicoes_ranking_snapshot_id_fkey";
ALTER TABLE "ranking_posicoes" ADD CONSTRAINT "ranking_posicoes_ranking_snapshot_id_fkey" FOREIGN KEY ("ranking_snapshot_id") REFERENCES "ranking_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 28. ranking_posicoes.parceiro_id -> parceiros: CASCADE -> RESTRICT
ALTER TABLE "ranking_posicoes" DROP CONSTRAINT "ranking_posicoes_parceiro_id_fkey";
ALTER TABLE "ranking_posicoes" ADD CONSTRAINT "ranking_posicoes_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 29. premios.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "premios" DROP CONSTRAINT "premios_gestor_pf_id_fkey";
ALTER TABLE "premios" ADD CONSTRAINT "premios_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 30. solicitacoes_resgate.parceiro_id -> parceiros: CASCADE -> RESTRICT
ALTER TABLE "solicitacoes_resgate" DROP CONSTRAINT "solicitacoes_resgate_parceiro_id_fkey";
ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 31. regras_comerciais.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "regras_comerciais" DROP CONSTRAINT "regras_comerciais_gestor_pf_id_fkey";
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 32. regras_gestores.gestor_pf_id -> gestores_pf: CASCADE -> RESTRICT
ALTER TABLE "regras_gestores" DROP CONSTRAINT "regras_gestores_gestor_pf_id_fkey";
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_gestor_pf_id_fkey" FOREIGN KEY ("gestor_pf_id") REFERENCES "gestores_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 33. procedimentos_pf.upload_id -> uploads_planilha_pf: CASCADE -> RESTRICT
ALTER TABLE "procedimentos_pf" DROP CONSTRAINT "procedimentos_pf_upload_id_fkey";
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads_planilha_pf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
