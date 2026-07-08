-- Script para verificar o problema dos relatórios vazios
-- Executar no PostgreSQL

-- 1. Verificar procedimentos em Julho/2026
SELECT 
  COUNT(*) as total_procedimentos,
  COUNT(comercial_id) as procedimentos_com_comercial,
  COUNT(*) - COUNT(comercial_id) as procedimentos_sem_comercial,
  SUM(total_pago) as total_vendas_geral,
  SUM(CASE WHEN comercial_id IS NOT NULL THEN total_pago ELSE 0 END) as vendas_com_comercial,
  SUM(CASE WHEN comercial_id IS NULL THEN total_pago ELSE 0 END) as vendas_sem_comercial
FROM procedimentos_pf 
WHERE data_referencia >= '2026-07-01' 
  AND data_referencia < '2026-08-01';

-- 2. Verificar comissões em Julho/2026
SELECT 
  COUNT(*) as total_comissoes,
  COUNT(DISTINCT comercial_id) as comerciais_com_comissao,
  SUM(valor_vendas) as total_vendas,
  SUM(valor_comissao) as total_comissoes_valor,
  AVG(valor_comissao) as media_comissao
FROM comissoes_comerciais
WHERE mes_referencia = '2026-07';

-- 3. Verificar detalhes dos procedimentos
SELECT 
  p.id,
  p.paciente,
  p.total_pago,
  p.comercial_id,
  c.nome as comercial_nome,
  c.funcao as comercial_funcao
FROM procedimentos_pf p
LEFT JOIN comerciais c ON p.comercial_id = c.id
WHERE p.data_referencia >= '2026-07-01' 
  AND p.data_referencia < '2026-08-01'
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Verificar upload de planilhas
SELECT 
  up.nome_arquivo,
  up.mes_referencia,
  up.status,
  up.total_rows,
  up.processed_rows,
  up.rejected_rows,
  up.orphaned_rows
FROM upload_planilha_pf up
WHERE up.mes_referencia = '2026-07'
ORDER BY up.created_at DESC;