-- Seed de usuários padrão para ambiente de produção
-- Execute: psql -U postgres -d asa_db -h localhost -f packages/database/sql/seed_usuarios_default.sql
-- senha padrão: 123456

-- ============================================================
-- 1. ADMIN
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  'Administrador',
  'admin@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'ADMIN',
  '(11) 99999-0000',
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  tipo = 'ADMIN',
  papel = NULL,
  atualizado_em = NOW();

-- ============================================================
-- 2. BackOffice Admin
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0002-000000000001',
  'BackOffice Admin',
  'back@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'GESTOR',
  'BACKOFFICE',
  NULL,
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  tipo = 'GESTOR',
  papel = 'BACKOFFICE',
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
  usuario_id = '00000000-0000-0000-0002-000000000001',
  updated_at = NOW();

-- ============================================================
-- 3. GESTOR PJ
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0003-000000000001',
  'Gestor PJ',
  'gestor-pj@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'GESTOR',
  'GESTOR_PJ',
  NULL,
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  tipo = 'GESTOR',
  papel = 'GESTOR_PJ',
  atualizado_em = NOW();

INSERT INTO backoffices (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0003-000000000002',
  '00000000-0000-0000-0003-000000000001',
  'Gestor PJ',
  '12345678902',
  5.00,
  100.00,
  NOW(),
  NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
  usuario_id = '00000000-0000-0000-0003-000000000001',
  updated_at = NOW();

-- ============================================================
-- 4. CONSULTOR
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0004-000000000001',
  'Consultor',
  'consultor@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'CONSULTOR',
  NULL,
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  tipo = 'CONSULTOR',
  papel = NULL,
  atualizado_em = NOW();

INSERT INTO consultores (id, usuario_id, cpf, pix_tipo, banco_nome, agencia, conta, total_consultas, criado_em)
VALUES (
  '00000000-0000-0000-0004-000000000002',
  '00000000-0000-0000-0004-000000000001',
  '12345678903',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
  usuario_id = '00000000-0000-0000-0004-000000000001',
  criado_em = NOW();

-- ============================================================
-- VERIFICACAO
-- ============================================================
SELECT 'Usuarios seed executado com sucesso!' AS status;
SELECT id, nome, email, tipo, papel FROM usuarios ORDER BY email;
SELECT id, nome, cpf, percentual_comissao_default FROM backoffices WHERE cpf = '12345678901';
SELECT id, cpf FROM consultores WHERE cpf = '12345678903';

