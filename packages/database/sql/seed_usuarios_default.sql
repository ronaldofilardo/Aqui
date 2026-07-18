-- Seed de usuários padrão para ambiente de produção
-- Execute: psql -U postgres -d asa_db -h localhost -f packages/database/sql/seed_usuarios_default.sql
-- senha padrão: 123456

-- ============================================================
-- 1. ADMIN
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, papel, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  'Administrador',
  'admin@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'ADMIN',
  '(11) 99999-0000',
  'ATIVO',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'ADMIN',
  papel = NULL,
  senha_temporaria = false,
  atualizado_em = NOW();

-- ============================================================
-- 2. BackOffice (tipo BACKOFFICE, papel BACKOFFICE)
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0002-000000000001',
  'BackOffice Admin',
  'back@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'BACKOFFICE',
  'BACKOFFICE',
  NULL,
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'BACKOFFICE',
  papel = 'BACKOFFICE',
  senha_temporaria = false,
  atualizado_em = NOW();

INSERT INTO backoffices (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0002-000000000001',
  'BackOffice Admin',
  '12345678901',
  5.00,
  100.00,
  NOW(),
  NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  usuario_id = EXCLUDED.usuario_id,
  updated_at = NOW();

-- ============================================================
-- 3. CONSULTOR
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, papel, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0004-000000000001',
  'Consultor',
  'consultor@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'CONSULTOR',
  NULL,
  'ATIVO',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'CONSULTOR',
  papel = NULL,
  senha_temporaria = false,
  atualizado_em = NOW();

INSERT INTO consultores (id, usuario_id, cpf, pix_tipo, banco_nome, agencia, conta, total_consultas, criado_em)
SELECT
  '00000000-0000-0000-0004-000000000002',
  u.id,
  '12345678903',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NOW()
FROM usuarios u
WHERE u.email = 'consultor@asa.com'
ON CONFLICT (cpf) DO UPDATE SET
  usuario_id = EXCLUDED.usuario_id,
  criado_em = NOW();

-- ============================================================
-- VERIFICACAO
-- ============================================================
SELECT 'Usuarios seed executado com sucesso!' AS status;
SELECT id, nome, email, tipo, papel FROM usuarios ORDER BY email;
SELECT id, nome, cpf, percentual_comissao_default FROM backoffices WHERE cpf = '12345678901';
SELECT id, cpf FROM consultores WHERE cpf = '12345678903';

-- ============================================================
-- NOTA: gestor-pj@asa.com (Consultor -> Estabelecimentos, R$20/R$10)
--       pertence a outra arquitetura e NAO eh modificado por este seed.
--       Sua criacao eh feita via fluxo de liderancas/gestores.
-- ============================================================
