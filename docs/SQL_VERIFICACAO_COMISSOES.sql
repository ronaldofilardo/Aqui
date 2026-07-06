-- Verificar Comissões por Função
-- Executar no banco de dados ASA

-- 1. Verificar comerciais e suas funções
SELECT 
  c.id,
  c.nome,
  c.cpf,
  c.funcao,
  c.status,
  g.email as gestor_email
FROM comerciais c
JOIN gestor_pf g ON c.gestor_pf_id = g.id
WHERE g.email = 'gestor-pf@asa.com'
ORDER BY c.funcao, c.nome;

-- 2. Verificar procedimentos com comercial
SELECT 
  p.id,
  p.paciente,
  p.cpf as cpf_paciente,
  p.procedimento,
  p.total_pago,
  p.comercial_id,
  c.nome as comercial_nome,
  c.funcao as comercial_funcao,
  p.data_referencia
FROM procedimentos_pf p
LEFT JOIN comerciais c ON p.comercial_id = c.id
WHERE p.data_referencia >= '2026-07-01'
  AND p.data_referencia < '2026-08-01'
ORDER BY p.data_referencia DESC;

-- 3. Verificar comissões calculadas
SELECT 
  cc.id,
  cc.mes_referencia,
  cc.valor_vendas,
  cc.valor_comissao,
  cc.status,
  c.nome as comercial_nome,
  c.funcao as comercial_funcao
FROM comissoes_comerciais cc
JOIN comerciais c ON cc.comercial_id = c.id
JOIN gestor_pf g ON c.gestor_pf_id = g.id
WHERE g.email = 'gestor-pf@asa.com'
  AND cc.mes_referencia = '2026-07'
ORDER BY c.funcao, c.nome;

-- 4. Resumo de comissões por função
SELECT 
  c.funcao,
  COUNT(DISTINCT c.id) as quantidade_comerciais,
  COUNT(cc.id) as quantidade_comissoes,
  SUM(cc.valor_vendas) as total_vendas,
  SUM(cc.valor_comissao) as total_comissoes
FROM comerciais c
LEFT JOIN comissoes_comerciais cc ON c.id = cc.comercial_id
JOIN gestor_pf g ON c.gestor_pf_id = g.id
WHERE g.email = 'gestor-pf@asa.com'
  AND cc.mes_referencia = '2026-07'
GROUP BY c.funcao
ORDER BY total_comissoes DESC;

-- 5. Verificar upload de planilhas
SELECT 
  up.id,
  up.nome_arquivo,
  up.mes_referencia,
  up.status,
  up.total_rows,
  up.processed_rows,
  up.rejected_rows,
  up.orphaned_rows,
  up.created_at
FROM upload_planilha_pf up
JOIN gestor_pf g ON up.gestor_pf_id = g.id
WHERE g.email = 'gestor-pf@asa.com'
ORDER BY up.created_at DESC;

-- 6. Contar procedimentos por comercial
SELECT 
  c.nome as comercial,
  c.funcao,
  COUNT(p.id) as quantidade_procedimentos,
  SUM(p.total_pago) as total_vendas
FROM comerciais c
LEFT JOIN procedimentos_pf p ON c.id = p.comercial_id
JOIN gestor_pf g ON c.gestor_pf_id = g.id
WHERE g.email = 'gestor-pf@asa.com'
  AND p.data_referencia >= '2026-07-01'
  AND p.data_referencia < '2026-08-01'
GROUP BY c.id, c.nome, c.funcao
ORDER BY total_vendas DESC;