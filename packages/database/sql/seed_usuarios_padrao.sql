-- Seed de usuários padrão para ambiente de dev/qa
-- Banco: asa_db
-- Execute: psql -U postgres -d asa_db -h localhost -f packages/database/sql/seed_usuarios_padrao.sql
-- Senha de todos: 123456

-- ============================================================
-- 0. Garantir que existe o valor 'GESTOR_PJ' no enum TipoUsuario
-- ============================================================
DO $$ BEGIN
  ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'GESTOR_PJ';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 1. ADMIN: admin@asa.com / 123456
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, papel, criado_em, atualizado_em)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Administrador',
  'admin@asa.com',
  '$2a$10$u8OQgliT6HXdJcRNAw6F..pupcZ0t5gKNnP.cv08UiigHi2enKBiO',
  'ADMIN',
  '(11) 99999-0001',
  'ATIVO',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'ADMIN',
  papel = NULL,
  status = 'ATIVO',
  senha_temporaria = false,
  atualizado_em = NOW();

-- ============================================================
-- 2. BackOffice: back@asa.com / 123456 — cpf 12345678901 papel/role: BackOffice
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'BackOffice',
  'back@asa.com',
  '$2a$10$u8OQgliT6HXdJcRNAw6F..pupcZ0t5gKNnP.cv08UiigHi2enKBiO',
  'BACKOFFICE',
  'BACKOFFICE',
  '(11) 99999-0002',
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'BACKOFFICE',
  papel = 'BACKOFFICE',
  status = 'ATIVO',
  senha_temporaria = false,
  atualizado_em = NOW();

INSERT INTO backoffices (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222223',
  '22222222-2222-2222-2222-222222222222',
  'BackOffice',
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
-- 3. Gestor PJ: gestor-pj@asa.com / 123456 — cpf 12345678902 tipo: GESTOR_PJ
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Gestor PJ',
  'gestor-pj@asa.com',
  '$2a$10$u8OQgliT6HXdJcRNAw6F..pupcZ0t5gKNnP.cv08UiigHi2enKBiO',
  'GESTOR_PJ',
  'GESTOR_PJ',
  '(11) 99999-0003',
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'GESTOR_PJ',
  papel = 'GESTOR_PJ',
  status = 'ATIVO',
  senha_temporaria = false,
  atualizado_em = NOW();

-- ============================================================
-- 4. Consultor: consultor@asa.com / 123456 — cpf 12345678903
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, papel, criado_em, atualizado_em)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Consultor',
  'consultor@asa.com',
  '$2a$10$u8OQgliT6HXdJcRNAw6F..pupcZ0t5gKNnP.cv08UiigHi2enKBiO',
  'CONSULTOR',
  '(11) 99999-0004',
  'ATIVO',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  tipo = 'CONSULTOR',
  papel = NULL,
  status = 'ATIVO',
  senha_temporaria = false,
  atualizado_em = NOW();

INSERT INTO consultores (id, usuario_id, cpf, pix_tipo, banco_nome, agencia, conta, total_consultas, criado_em)
SELECT
  '44444444-4444-4444-4444-444444444445',
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
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'Usuários padrão semeados com sucesso!' AS status;
SELECT email, tipo, papel, status
FROM usuarios
WHERE email IN ('admin@asa.com', 'back@asa.com', 'gestor-pj@asa.com', 'consultor@asa.com')
ORDER BY email;
