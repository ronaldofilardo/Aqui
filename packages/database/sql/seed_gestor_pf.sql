-- Seed para Domínio PF - Gestor PF
-- Execute: psql -U postgres -d asa_db -h localhost -f seed_gestor_pf.sql

-- Criar usuário para Gestor PF
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, senha_temporaria, criado_em, atualizado_em)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Irys Admin',
  'irys@as.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bMxOVJLpS2k/xKm', -- 123456
  'GESTOR_PF',
  NULL,
  'ATIVO',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Criar Gestor PF
INSERT INTO gestores_pf (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Irys Admin',
  '12345678901', -- CPF placeholder
  5.00,
  100.00,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT 'Gestor PF criado com sucesso!' AS status;
SELECT id, nome, email, tipo FROM usuarios WHERE email = 'irys@as.com';
SELECT id, nome, cpf, percentual_comissao_default FROM gestores_pf WHERE nome = 'Irys Admin';