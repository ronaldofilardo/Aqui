# 📋 Lista de Refatoração - ASA Monorepo

**Baseado na Política de Refatoração (máx 500 linhas/arquivo)**  
**Data:** Julho 2026

---

## 🔴 CRÍTICO - Refatoração Imediata (>500 linhas)

### 1. `apps/web/app/(dashboard)/gestor-pf/configuracoes/comissoes-gestao/page.tsx`
- **Linhas:** 1271
- **Prioridade:** 🔴 MÁXIMA
- **Ação Necessária:**
  - Extrair 4-5 hooks customizados (`useComerciais`, `useMetas`, `useComissoes`, `useRegras`)
  - Extrair 5-6 componentes (`ComerciaisList`, `MetasForm`, `ComissoesTable`, `RegrasPanel`, `ComercialModal`)
  - Criar `types.ts` dedicado
  - Mover server actions para `actions.ts`
- **Meta:** Reduzir para ~180 linhas

### 2. `apps/web/app/(dashboard)/gestor-pf/pontos/page.tsx`
- **Linhas:** 642
- **Prioridade:** 🔴 MÁXIMA
- **Ação Necessária:**
  - Extrair hooks de gestão de pontos e ciclos
  - Extrair componentes de UI (tabelas, formulários, modais)
  - Separar lógica de distribuição de pontos
- **Meta:** Reduzir para ~200 linhas

### 3. `apps/web/app/api/v1/gestor-pf/uploads/route.ts`
- **Linhas:** 563
- **Prioridade:** 🔴 MÁXIMA
- **Ação Necessária:**
  - Extrair `service.ts` com regras de negócio
  - Extrair `parser.ts` para parsing de planilhas
  - Extrair `validator.ts` com schemas Zod
  - Mover helpers de response para `responses.ts`
- **Meta:** Reduzir para ~80-100 linhas

### 4. `apps/web/app/(dashboard)/gestor-pf/producao/relatorios/page.tsx`
- **Linhas:** 519
- **Prioridade:** 🟠 ALTA
- **Ação Necessária:**
  - Extrair componentes de relatório
  - Extrair hooks de busca/filtro
  - Separar lógica de exportação
- **Meta:** Reduzir para ~200 linhas

---

## 🟠 ALTA - Refatoração Recomendada (400-500 linhas)

### 5. `apps/web/app/(dashboard)/gestor/consultores/page.tsx`
- **Linhas:** 500
- **Prioridade:** 🟠 ALTA
- **Status:** No limite máximo
- **Ação Necessária:**
  - Prevenir crescimento
  - Extrair componentes de lista e formulário
  - Extrair hook `useConsultores`
- **Meta:** Reduzir para ~250 linhas

### 6. `apps/web/app/(dashboard)/gestor-pf/parceiros/page.tsx`
- **Linhas:** 490
- **Prioridade:** 🟠 ALTA
- **Ação Necessária:**
  - Extrair componentes de parceiros
  - Extrair hooks de gestão
- **Meta:** Reduzir para ~250 linhas

### 7. `apps/web/app/(dashboard)/gestor-pf/uploads/page.tsx`
- **Linhas:** 458
- **Prioridade:** 🟠 ALTA
- **Ação Necessária:**
  - Extrair componentes de upload
  - Extrair hooks de preview e processamento
- **Meta:** Reduzir para ~200 linhas

### 8. `apps/web/app/(auth)/login/page.tsx`
- **Linhas:** 433
- **Prioridade:** 🟠 ALTA
- **Ação Necessária:**
  - Extrair formulário de login
  - Extrair hooks de autenticação
  - Simplificar JSX
- **Meta:** Reduzir para ~150 linhas

---

## 🟡 MÉDIA - Refatoração Preventiva (300-400 linhas)

### 9. `apps/web/app/(dashboard)/parceiro/pontos/page.tsx`
- **Linhas:** 379
- **Prioridade:** 🟡 MÉDIA
- **Ação Necessária:**
  - Extrair componentes de extrato
  - Extrair hook `usePontos`
- **Meta:** Reduzir para ~180 linhas

### 10. `apps/web/app/(dashboard)/gestor-pf/configuracoes/regras/page.tsx`
- **Linhas:** 365
- **Prioridade:** 🟡 MÉDIA
- **Ação Necessária:**
  - Extrair formulário de regras
  - Extrair hook `useRegras`
- **Meta:** Reduzir para ~180 linhas

### 11. `apps/web/app/api/v1/gestor-pf/uploads/preview/route.ts`
- **Linhas:** 337
- **Prioridade:** 🟡 MÉDIA
- **Ação Necessária:**
  - Extrair parser para arquivo dedicado
  - Extrair validadores
- **Meta:** Reduzir para ~100 linhas

### 12. `apps/web/app/(dashboard)/gestor-pf/producao/procedimentos/page.tsx`
- **Linhas:** 328
- **Prioridade:** 🟡 MÉDIA
- **Ação Necessária:**
  - Extrair tabela de procedimentos
  - Extrair hooks de filtro
- **Meta:** Reduzir para ~180 linhas

### 13. `apps/web/app/(dashboard)/gestor-pf/producao/pagamentos/page.tsx`
- **Linhas:** 327
- **Prioridade:** 🟡 MÉDIA
- **Ação Necessária:**
  - Extrair componentes de pagamento
  - Extrair hooks de busca
- **Meta:** Reduzir para ~180 linhas

### 14. `apps/web/app/(dashboard)/gestor/producao/page.tsx`
- **Linhas:** 309
- **Prioridade:** 🟡 MÉDIA
- **Ação Necessária:**
  - Extrair componentes de relatório
  - Extrair hooks de dados
- **Meta:** Reduzir para ~180 linhas

---

## 🟢 BAIXA - Componentes e Libs (200-300 linhas)

### Components

| Arquivo | Linhas | Ação |
|---------|--------|------|
| `components/gestor-pf/fila-resgates.tsx` | 300 | Extrair sub-componentes |
| `components/gestor-pf/gerenciador-premios.tsx` | 296 | Extrair sub-componentes |
| `components/gestor-pf/gerenciador-ciclos-pontos.tsx` | 295 | Extrair sub-componentes |
| `components/parceiro/minhas-solicitacoes-resgate.tsx` | 214 | Extrair sub-componentes |

### Libraries

| Arquivo | Linhas | Ação |
|---------|--------|------|
| `apps/web/lib/pontos-utils.ts` | 260 | Separar em módulos (calculos, ciclos, comissoes) |
| `packages/shared/src/schemas.ts` | 362 | Separar por domínio (usuario, comercial, pontos, comissao) |

---

## 📊 Resumo por Categoria

### Pages (Next.js)
- **>500 linhas:** 4 arquivos (CRÍTICO)
- **400-500 linhas:** 4 arquivos (ALTA)
- **300-400 linhas:** 6 arquivos (MÉDIA)
- **Total pages para refatorar:** 14

### API Routes
- **>500 linhas:** 1 arquivo (CRÍTICO)
- **300-400 linhas:** 1 arquivo (MÉDIA)
- **Total API routes para refatorar:** 2

### Components
- **200-300 linhas:** 4 arquivos (BAIXA)
- **Total components para refatorar:** 4

### Libraries
- **200-300 linhas:** 2 arquivos (BAIXA)
- **Total libs para refatorar:** 2

---

## 🎯 Plano de Ação

### Sprint 1 - Crítico (Semana 1-2)
1. ✅ `comissoes-gestao/page.tsx` (1271 → ~180 linhas)
2. ✅ `pontos/page.tsx` (642 → ~200 linhas)
3. ✅ `uploads/route.ts` (563 → ~100 linhas)

### Sprint 2 - Alta (Semana 3-4)
4. ✅ `relatorios/page.tsx` (519 → ~200 linhas)
5. ✅ `consultores/page.tsx` (500 → ~250 linhas)
6. ✅ `parceiros/page.tsx` (490 → ~250 linhas)
7. ✅ `uploads/page.tsx` (458 → ~200 linhas)
8. ✅ `login/page.tsx` (433 → ~150 linhas)

### Sprint 3 - Média (Semana 5-6)
9-14. ✅ Refatorar 6 páginas entre 300-400 linhas

### Sprint 4 - Componentes e Libs (Semana 7-8)
- ✅ Refatorar 4 components grandes
- ✅ Separar `pontos-utils.ts` em módulos
- ✅ Separar `schemas.ts` por domínio

---

## 📈 Métricas de Sucesso

| Métrica | Atual | Meta | Redução |
|---------|-------|------|---------|
| Arquivos >500 linhas | 4 | 0 | -100% |
| Arquivos >400 linhas | 8 | 0 | -100% |
| Arquivos >300 linhas | 14 | 0 | -100% |
| Média de linhas/page | ~550 | ~200 | -64% |
| Total arquivos p/ refatorar | 22 | 0 | -100% |

---

## 🛠️ Scripts Úteis

### Listar arquivos >500 linhas
```powershell
Get-ChildItem -Path "apps\web" -Recurse -Include *.ts,*.tsx -File | 
  ForEach-Object { 
    [PSCustomObject]@{
      Path = $_.FullName.Replace((Get-Location).Path + "\", "")
      Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    } 
  } | 
  Where-Object { $_.Lines -gt 500 } | 
  Sort-Object Lines -Descending
```

### Contar linhas por diretório
```powershell
Get-ChildItem -Path "apps\web\app" -Recurse -Include *.tsx -File | 
  Group-Object { $_.DirectoryName.Split('\')[3] } | 
  ForEach-Object {
    $total = ($_ | ForEach-Object { Get-Content $_.Group.FullName | Measure-Object -Line }).Lines
    [PSCustomObject]@{
      Dir = $_.Name
      Files = $_.Count
      TotalLines = $total
    }
  } | Sort-Object TotalLines -Descending
```

---

*Última atualização: Julho 2026*