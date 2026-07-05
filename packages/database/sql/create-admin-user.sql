-- Manual SQL to create ADMIN user if migration fails
-- Execute this script in your PostgreSQL database (asa_db):

-- First, ensure ADMIN type exists in enum (if migration hasn't run)
-- ALTER TYPE "TipoUsuario" ADD VALUE 'ADMIN';

-- Create admin user
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, telefone, status, criado_em, atualizado_em)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Administrador',
  'admin@asa.com',
  '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  'ADMIN',
  '(11) 99999-0000',
  'ATIVO',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  senha_hash = '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni',
  tipo = 'ADMIN',
  atualizado_em = NOW();
