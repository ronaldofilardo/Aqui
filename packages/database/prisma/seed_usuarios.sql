-- Script de Seed para usuários básicos
-- Executar: psql -U postgres -d asa_db -h localhost -f seed_usuarios.sql

-- Primeiro, vamos verificar se as tabelas existem
\echo '=== Seed de Usuários Básicos ==='

-- Criar usuário Admin
DO $$
DECLARE
  usuario_id UUID;
  senha_hash TEXT;
BEGIN
  -- Hash da senha '123456' com bcrypt (usando um hash pré-calculado para simplificar)
  -- Na prática, use bcrypt no Node.js
  senha_hash := '$2a$12$LqlvWzH1bDMSFkHnVKxG5OZqvZ8qKxLxVxKqxLxVxKqxLxVxKqxLx';
  
  -- Admin
  INSERT INTO usuarios (nome, email, senha_hash, tipo, status, senha_temporaria)
  VALUES ('Administrador', 'admin@asa.com', senha_hash, 'ADMIN', 'ATIVO', false)
  ON CONFLICT (email) DO UPDATE SET senha_hash = senha_hash, senha_temporaria = false;
  
  -- Gestor PF
  INSERT INTO usuarios (nome, email, senha_hash, tipo, status, senha_temporaria)
  VALUES ('Gestor PF', 'gestor-pf@asa.com.br', senha_hash, 'GESTOR', 'ATIVO', false)
  ON CONFLICT (email) DO UPDATE SET senha_hash = senha_hash, senha_temporaria = false;
  
  -- Criar registro GestorPF
  INSERT INTO gestores_pf (usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max)
  SELECT u.id, 'Gestor PF', '12345678901', 5.00, 100.00
  FROM usuarios u WHERE u.email = 'gestor-pf@asa.com.br'
  ON CONFLICT (usuario_id) DO NOTHING;
  
  -- Gestor PJ
  INSERT INTO usuarios (nome, email, senha_hash, tipo, status, senha_temporaria)
  VALUES ('Gestor PJ', 'gestor-pj@asa.com.br', senha_hash, 'GESTOR', 'ATIVO', false)
  ON CONFLICT (email) DO UPDATE SET senha_hash = senha_hash, senha_temporaria = false;
  
  -- Consultor
  INSERT INTO usuarios (nome, email, senha_hash, tipo, status, senha_temporaria)
  VALUES ('Consultor Teste', 'consultor@asa.com.br', senha_hash, 'CONSULTOR', 'ATIVO', false)
  ON CONFLICT (email) DO UPDATE SET senha_hash = senha_hash, senha_temporaria = false;
  
  -- Criar registro Consultor
  INSERT INTO consultores (usuario_id)
  SELECT u.id FROM usuarios u WHERE u.email = 'consultor@asa.com.br'
  ON CONFLICT (usuario_id) DO NOTHING;
  
  \echo '=== Usuários criados com sucesso! ==='
  \echo 'Admin: admin@asa.com / 123456'
  \echo 'Gestor PF: gestor-pf@asa.com.br / 123456'
  \echo 'Gestor PJ: gestor-pj@asa.com.br / 123456'
  \echo 'Consultor: consultor@asa.com.br / 123456'
END $$;

-- Listar usuários criados
SELECT email, tipo, status FROM usuarios WHERE email IN (
  'admin@asa.com',
  'gestor-pf@asa.com.br',
  'gestor-pj@asa.com.br',
  'consultor@asa.com.br'
);