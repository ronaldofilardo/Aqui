# Diagnóstico: Tela de Relatórios Não Muda

## Problema Reportado
A tela `/gestor-pf/producao/relatorios` não muda, fica com botão "Buscando..." e loading infinito.

## Possíveis Causas

### 1. Loading Infinito (botão "Buscando...")
**Sintoma:** Botão fica como "Buscando..." indefinidamente

**Causa provável:** Função `buscarRelatorio()` não está sendo chamada ou está travada

**Como diagnosticar:**
1. Abrir Console do Navegador (F12)
2. Ir para aba "Console"
3. Selecionar período (2026-07 a 2026-07)
4. Clicar em "🔍 Buscar"
5. Verificar se aparecem logs:
   ```
   [buscarRelatorio] Iniciando busca... {inicio: "2026-07", fim: "2026-07", ...}
   [buscarRelatorio] URL params: inicio=2026-07&fim=2026-07
   [buscarRelatorio] Response status: 200
   [buscarRelatorio] Dados recebidos: {...}
   [buscarRelatorio] Loading finalizado
   ```

**Se NÃO aparecerem logs:**
- Problema no clique do botão
- Verificar se há erro de JavaScript antes

**Se aparecerem logs com erro:**
- Verificar erro específico no console
- Verificar aba "Network" para ver resposta da API

---

### 2. API Retornando Erro
**Sintoma:** Logs mostram erro na requisição

**Como diagnosticar:**
1. F12 → Console
2. Clicar em "🔍 Buscar"
3. Verificar erro

**Possíveis erros:**

#### Erro 1: `Cannot read property 'totalGeral' of undefined`
**Causa:** API não está retornando `resumo`

**Solução:** Verificar API `/api/v1/gestor-pf/relatorio-comissoes`

#### Erro 2: `Network Error` ou `Failed to fetch`
**Causa:** Servidor não está respondendo

**Solução:** 
- Verificar se servidor está rodando
- Verificar logs do servidor

#### Erro 3: API retorna 500 ou 400
**Causa:** Erro no backend

**Solução:** Verificar logs do servidor Next.js

---

### 3. Dados Vazios (sem comissões)
**Sintoma:** API retorna dados, mas tela não mostra nada

**Como diagnosticar:**
1. F12 → Console
2. Verificar logs:
   ```
   [buscarRelatorio] Dados recebidos: { comissoes: [], resumo: {...} }
   ```

**Se `comissoes: []`:**
- Não há comissões no banco de dados
- Isso é NORMAL se a planilha não tinha "CPF do Comercial"
- **Solução:** Usar botão "📋 Verificar procedimentos sem comercial"

**Se `resumo.porFuncao: []`:**
- Não há comissões agrupadas por função
- Também é NORMAL sem dados

---

### 4. Problema com Filtro de Função
**Sintoma:** Dropdown "Função" não mostra opções

**Como diagnosticar:**
1. F12 → Network
2. Verificar requisição: `GET /api/v1/gestor-pf/comerciais`
3. Verificar resposta:
   ```json
   [
     {
       "id": "...",
       "nome": "Testes Ger Cire",
       "funcao": "GERENTE_CIRE"  ← Deve estar presente
     }
   ]
   ```

**Se `funcao` não estiver na resposta:**
- API de comerciais não está retornando campo
- **Solução:** Verificar arquivo `apps/web/app/api/v1/gestor-pf/comerciais/route.ts`

---

## Passo a Passo de Debug

### Passo 1: Verificar se há dados no banco
```sql
-- Executar no banco de dados
SELECT COUNT(*) FROM procedimentos_pf 
WHERE data_referencia >= '2026-07-01' 
  AND data_referencia < '2026-08-01';

SELECT COUNT(*) FROM comissoes_comerciais 
WHERE mes_referencia = '2026-07';
```

**Resultado esperado:**
- procedimentos_pf: 3 (ou mais)
- comissoes_comerciais: 0 (se planilha não tinha CPF do Comercial)

---

### Passo 2: Testar API Diretamente

No navegador, acessar:
```
http://localhost:3000/api/v1/gestor-pf/relatorio-comissoes?inicio=2026-07&fim=2026-07
```

**Resposta esperada:**
```json
{
  "comissoes": [],
  "resumo": {
    "porMes": [],
    "porFuncao": [],
    "totalGeral": {
      "totalVendas": 0,
      "totalComissao": 0,
      "quantidade": 0
    }
  }
}
```

---

### Passo 3: Verificar Console do Navegador

1. Abrir `/gestor-pf/producao/relatorios`
2. F12 → Console
3. Selecionar período
4. Clicar em "🔍 Buscar"

**Logs esperados:**
```
[buscarRelatorio] Iniciando busca... {inicio: "2026-07", fim: "2026-07", ...}
[buscarRelatorio] URL params: inicio=2026-07&fim=2026-07
[buscarRelatorio] Response status: 200
[buscarRelatorio] Dados recebidos: {comissoes: [], resumo: {...}}
[buscarRelatorio] Loading finalizado
```

---

### Passo 4: Verificar Procedimentos sem Comercial

1. Na tela de Relatórios
2. Selecionar mês: `2026-07`
3. Clicar em "📋 Verificar procedimentos sem comercial"

**Logs esperados no console:**
```
[verificarProcedimentosSemComercial] Buscando mês: 2026-07
[verificarProcedimentosSemComercial] Resposta status: 200
[verificarProcedimentosSemComercial] Dados: {procedimentosSemComercial: 3, ...}
```

**Toast esperado:**
- "3 procedimentos sem comercial (R$ 807,00)"

---

### Passo 5: Reprocessar Comissões

Se houver procedimentos sem comercial:

1. Selecionar comercial no dropdown: "Testes Ger Cire"
2. Clicar em "🔗 Vincular ao Comercial"

**Logs esperados:**
```
POST /api/v1/gestor-pf/reprocessar-comissoes
Body: { comercialId: "...", mesReferencia: "2026-07" }
```

**Toast esperado:**
- "✅ 3 procedimentos vinculados - Comissão: R$ 80,70"

---

### Passo 6: Buscar Relatório Novamente

Após reprocessar:

1. Clicar em "🔍 Buscar"
2. Verificar se agora aparece o resumo por função

**Resultado esperado:**
- Card "🥇 Gerente Cire"
- Total Vendas: R$ 807,00
- Total Comissões: R$ 80,70 (ou valor calculado)

---

## Checklist de Verificação

### Backend
- [ ] API `/api/v1/gestor-pf/comerciais` retorna campo `funcao`
- [ ] API `/api/v1/gestor-pf/relatorio-comissoes` retorna `resumo.porFuncao`
- [ ] API `/api/v1/gestor-pf/reprocessar-comissoes` funciona
- [ ] Servidor Next.js está rodando sem erros

### Frontend
- [ ] Página `/gestor-pf/producao/relatorios` carrega sem erros
- [ ] Dropdown "Função" mostra opções (se houver comerciais)
- [ ] Botão "🔍 Buscar" chama função `buscarRelatorio()`
- [ ] Botão "📋 Verificar procedimentos sem comercial" funciona
- [ ] Botão "🔗 Vincular ao Comercial" funciona

### Banco de Dados
- [ ] Tabela `procedimentos_pf` tem registros em Julho/2026
- [ ] Tabela `comerciais` tem pelo menos 1 comercial com funcao
- [ ] Tabela `comissoes_comerciais` pode estar vazia (normal)

---

## Soluções Rápidas

### Problema: Loading infinito
**Solução:** 
```bash
# Reiniciar servidor de desenvolvimento
Ctrl+C
rm -rf .next
pnpm dev
```

### Problema: API não retorna funcao
**Solução:** Verificar arquivo `apps/web/app/api/v1/gestor-pf/comerciais/route.ts:33`
```typescript
funcao: c.funcao,  // ← Esta linha deve existir
```

### Problea: Sem comissões no banco
**Solução:** Usar reprocessamento
1. Acessar `/gestor-pf/producao/relatorios`
2. Selecionar mês `2026-07`
3. Clicar em "📋 Verificar procedimentos sem comercial"
4. Selecionar comercial "Testes Ger Cire"
5. Clicar em "🔗 Vincular ao Comercial"

---

## Contato

Se após seguir este guia o problema persistir, fornecer:
1. Logs do console do navegador (F12 → Console)
2. Resposta da API (F12 → Network → relatorio-comissoes)
3. Resultado das queries SQL do banco de dados
4. Logs do servidor Next.js