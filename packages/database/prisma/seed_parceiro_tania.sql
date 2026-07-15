-- Script de Seed para Parceiro Tania Kar e Indicados
-- Executar: psql -U postgres -d asa_db -h localhost -f seed_parceiro_tania.sql

-- 1. Garantir que o Backoffice existe
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, status, senha_temporaria)
VALUES (gen_random_uuid(), 'Backoffice Admin', 'backoffice@asa.com', '$2a$12$LqlvWzH1bDMSFkHnVKxG5OZqvZ8qKxLxVxKqxLxVxKqxLxVxKqxLx', 'BACKOFFICE', 'BACKOFFICE', 'ATIVO', false)
ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, senha_temporaria = false;

-- 2. Criar usuário parceiro Tania Kar
INSERT INTO usuarios (id, nome, email, senha_hash, tipo, papel, telefone, status, senha_temporaria)
VALUES (gen_random_uuid(), 'Tania Kar', 'erew@dfsfds.com', '$2a$12$LqlvWzH1bDMSFkHnVKxG5OZqvZ8qKxLxVxKqxLxVxKqxLxVxKqxLx', 'GESTOR', null, '41992415220', 'ATIVO', false)
ON CONFLICT (email) DO UPDATE SET 
  nome = 'Tania Kar',
  senha_hash = EXCLUDED.senha_hash, 
  senha_temporaria = false,
  telefone = '41992415220';

-- 3. Garantir registro Backoffice
INSERT INTO backoffices (id, usuario_id, nome, cpf, percentual_comissao_default, percentual_comissao_max, created_at, updated_at)
SELECT gen_random_uuid(), u.id, 'Backoffice Admin', '12345678901', 5.00, 100.00, NOW(), NOW()
FROM usuarios u WHERE u.email = 'backoffice@asa.com'
ON CONFLICT (usuario_id) DO NOTHING;

-- 4. Criar registro Parceiro para Tania Kar
INSERT INTO parceiros (id, usuario_id, nome, cpf, pix_chave, status, backoffice_id, periodicidade_ciclo_escolhida, created_at, updated_at)
SELECT gen_random_uuid(), u.id, 'Tania Kar', '04703084945', '04703084945', 'ATIVO', b.id, 'ANUAL', NOW(), NOW()
FROM usuarios u
CROSS JOIN backoffices b
WHERE u.email = 'erew@dfsfds.com' AND b.cpf = '12345678901'
ON CONFLICT (cpf) DO UPDATE SET
  nome = 'Tania Kar',
  usuario_id = EXCLUDED.usuario_id,
  pix_chave = '04703084945',
  status = 'ATIVO',
  updated_at = NOW();

-- 5. Criar indicados
INSERT INTO indicados (id, nome, cpf, telefone, status, parceiro_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Marcia Costa De Oliveira', '07102342950', '41992415220', 'ATIVO', p.id, NOW(), NOW()
FROM parceiros p WHERE p.cpf = '04703084945'
ON CONFLICT (cpf) DO UPDATE SET nome = 'Marcia Costa De Oliveira', telefone = '41992415220', status = 'ATIVO', updated_at = NOW();

INSERT INTO indicados (id, nome, cpf, telefone, status, parceiro_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Rosangela Depieri', '87208377987', '41992415221', 'ATIVO', p.id, NOW(), NOW()
FROM parceiros p WHERE p.cpf = '04703084945'
ON CONFLICT (cpf) DO UPDATE SET nome = 'Rosangela Depieri', telefone = '41992415221', status = 'ATIVO', updated_at = NOW();

INSERT INTO indicados (id, nome, cpf, telefone, status, parceiro_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Camila Iagla Pires', '10645564931', '41992415222', 'ATIVO', p.id, NOW(), NOW()
FROM parceiros p WHERE p.cpf = '04703084945'
ON CONFLICT (cpf) DO UPDATE SET nome = 'Camila Iagla Pires', telefone = '41992415222', status = 'ATIVO', updated_at = NOW();

INSERT INTO indicados (id, nome, cpf, telefone, status, parceiro_id, created_at, updated_at)
SELECT gen_random_uuid(), 'ELIDIANE DOS SANTOS PAULINO DOS ANJOS', '12114106926', '41992415223', 'ATIVO', p.id, NOW(), NOW()
FROM parceiros p WHERE p.cpf = '04703084945'
ON CONFLICT (cpf) DO UPDATE SET nome = 'ELIDIANE DOS SANTOS PAULINO DOS ANJOS', telefone = '41992415223', status = 'ATIVO', updated_at = NOW();

INSERT INTO indicados (id, nome, cpf, telefone, status, parceiro_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Leaci De Fatima Da Silva', '03075398810', '41992415224', 'ATIVO', p.id, NOW(), NOW()
FROM parceiros p WHERE p.cpf = '04703084945'
ON CONFLICT (cpf) DO UPDATE SET nome = 'Leaci De Fatima Da Silva', telefone = '41992415224', status = 'ATIVO', updated_at = NOW();

-- Listar o parceiro criado
SELECT p.id, p.nome, p.cpf, u.telefone, u.email, p.status 
FROM parceiros p 
JOIN usuarios u ON u.id = p.usuario_id 
WHERE p.cpf = '04703084945';

-- Listar todos os indicados de Tania Kar
SELECT i.id, i.nome, i.cpf, i.telefone, i.status, p.nome as parceiro_nome
FROM indicados i
JOIN parceiros p ON p.id = i.parceiro_id
WHERE p.cpf = '04703084945'
ORDER BY i.nome;