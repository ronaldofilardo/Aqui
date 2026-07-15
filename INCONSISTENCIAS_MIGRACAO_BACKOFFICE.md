# 🚨 Relatório de Inconsistências - Migração BACKOFFICE

**Data:** 2026-07-12  
**Status:** ⚠️ **INCONSISTÊNCIAS ENCONTRADAS**

---

## 🔴 CRÍTICO - Requer Correção Imediata

### 1. Tipo TypeScript Inconsistente

**Arquivo:** `apps/web/app/(dashboard)/backoffice/configuracoes/liderancas/[id]/page.tsx:36-39`

**Problema:**
```typescript
interface LiderancaDetalhes {
  gestorPf: {  // ❌ DEVERIA SER: backoffice
    id: string;
    nome: string;
  };
}
```

**Impacto:** 
- Type error em tempo de compilação
- Dados não carregam corretamente
- Quebra de tipagem em toda a árvore de componentes

**Solução:**
```typescript
interface LiderancaDetalhes {
  backoffice: {
    id: string;
    nome: string;
  };
}
```

**Prioridade:** 🔴 **CRÍTICA**

---

### 2. Scripts de Banco com Código Antigo

**Arquivos:**
- `packages/database/prisma/fix-papel.ts:7` - Variável `gestorPf`
- `packages/database/prisma/limpar-banco.ts:32` - `prisma.gestorPF.deleteMany()`

**Problema:**
```typescript
// fix-papel.ts
const gestorPf = await prisma.usuario.updateMany({  // ❌
  // ...
});

// limpar-banco.ts
await prisma.gestorPF.deleteMany();  // ❌ DEVERIA SER: backoffice
```

**Impacto:**
- Scripts não funcionam
- Erros em tempo de execução
- Limpeza de banco falha

**Solução:**
```typescript
// fix-papel.ts
const backoffice = await prisma.usuario.updateMany({

// limpar-banco.ts
await prisma.backoffice.deleteMany();
```

**Prioridade:** 🔴 **CRÍTICA**

---

## 🟠 ALTA PRIORIDADE - Funcionalidade Comprometida

### 3. Comentários de API Desatualizados

**Arquivos:**
- `apps/web/app/api/v1/backoffice/comerciais/route.ts:36,96`
- `apps/web/app/api/v1/backoffice/comerciais/calcular-comissao/route.ts:10`
- `apps/web/app/api/v1/backoffice/pontos/distribuir/route.ts:63,192`
- `apps/web/app/api/v1/backoffice/relatorio-comissoes/route.ts:6`
- `apps/web/app/api/v1/backoffice/reprocessar-comissoes/route.ts:9,188`

**Problema:**
```typescript
// Comentários ainda referenciam gestor-pf
// POST /api/v1/gestor-pf/comerciais/calcular-comissao ❌
```

**Impacto:**
- Documentação incorreta
- Confusão para desenvolvedores
- Dificuldade de manutenção

**Solução:**
Substituir todos os comentários:
```typescript
// POST /api/v1/backoffice/comerciais/calcular-comissao ✅
```

**Prioridade:** 🟠 **ALTA**

---

### 4. Testes com Dados Inconsistentes

**Arquivos:**
- `apps/web/app/__tests__/comissoes-gestao-page.test.ts:52`
- `apps/web/app/__tests__/upload-planilha-correcoes.test.ts:325-372`

**Problema:**
```typescript
gestorPfId: "gestor-123",  // ❌ DEVERIA SER: backofficeId
```

**Impacto:**
- Testes falham
- Validação incorreta
- Falsa sensação de segurança

**Solução:**
```typescript
backofficeId: "backoffice-123",  // ✅
```

**Prioridade:** 🟠 **ALTA**

---

## 🟡 MÉDIA PRIORIDADE - Melhoria Necessária

### 5. Enums do Banco Inconsistentes

**Problema:**
- Enum `PapelGestor` no banco tem `GESTOR_PF` e `GESTOR_PJ`
- Deveria ter `BACKOFFICE` e `GESTOR_PJ`

**Impacto:**
- Type safety comprometido
- Validação de dados falha
- Possível erro em queries

**Solução:**
```sql
DO $$ BEGIN
  ALTER TYPE "PapelGestor" ADD VALUE 'BACKOFFICE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

**Nota:** PostgreSQL não permite remover valores de enum, apenas adicionar.

**Prioridade:** 🟡 **MÉDIA**

---

### 6. Aliases Deprecated em Produção

**Arquivo:** `apps/web/lib/api-helpers.ts:140,175`

**Código:**
```typescript
export const requireGestorPF = requireBackoffice;  // ⚠️ Deprecated
export const requireGestorPFWithScope = requireBackofficeWithScope;  // ⚠️
```

**Problema:**
- Aliases mantidos para compatibilidade
- Desenvolvedores podem usar código antigo
- Dívida técnica

**Solução:**
1. Manter por 30 dias (compatibilidade)
2. Adicionar warning de deprecated
3. Remover após 30 dias

```typescript
/** @deprecated Use requireBackoffice instead */
export const requireGestorPF = requireBackoffice;
```

**Prioridade:** 🟡 **MÉDIA**

---

## 🟢 BAIXA PRIORIDADE - Cosmético

### 7. Strings de UI em Inglês

**Problema:** Alguns logs e mensagens em inglês
- `"Updated Backoffice:"` (deveria ser português)

**Impacto:** Mínimo
**Prioridade:** 🟢 **BAIXA**

---

## 📊 Resumo por Categoria

| Categoria | Crítico | Alta | Média | Baixa | Total |
|-----------|---------|------|-------|-------|-------|
| **Frontend** | 1 | 0 | 0 | 0 | 1 |
| **Backend** | 1 | 4 | 1 | 0 | 6 |
| **Banco** | 0 | 0 | 1 | 0 | 1 |
| **Testes** | 0 | 2 | 0 | 0 | 2 |
| **Docs** | 0 | 0 | 0 | 0 | 0 |
| **TOTAL** | **2** | **6** | **2** | **0** | **10** |

---

## 🎯 Plano de Ação

### Fase 1: Crítico (Imediato)
- [ ] Corrigir tipo `gestorPf` → `backoffice` no frontend
- [ ] Corrigir scripts `fix-papel.ts` e `limpar-banco.ts`

### Fase 2: Alta Prioridade (24h)
- [ ] Atualizar comentários das APIs
- [ ] Corrigir testes unitários

### Fase 3: Média Prioridade (7 dias)
- [ ] Adicionar enum `BACKOFFICE` no banco
- [ ] Adicionar deprecated warnings

### Fase 4: Baixa Prioridade (30 dias)
- [ ] Traduzir logs e mensagens

---

## ⚠️ Riscos

### Risco 1: Quebra em Produção
**Probabilidade:** Alta  
**Impacto:** Crítico  
**Mitigação:** Corrigir itens críticos antes do deploy

### Risco 2: Testes Falsos Positivos
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:** Revisar e corrigir todos os testes

### Risco 3: Dados Inconsistentes
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:** Validar constraints no banco

---

## ✅ Checklist de Validação Pós-Correção

- [ ] TypeScript compila sem erros
- [ ] Todos os testes passam
- [ ] APIs respondem corretamente
- [ ] Frontend renderiza sem erros
- [ ] Banco de dados consistente
- [ ] Scripts funcionam
- [ ] Documentação atualizada

---

## 📝 Scripts de Correção Automática

### Corrigir Frontend
```bash
# Tipo gestorPf → backoffice
find apps/web/app -name "*.tsx" -type f -exec sed -i 's/gestorPf:/backoffice:/g' {} \;
```

### Corrigir Scripts
```bash
# fix-papel.ts
sed -i 's/const gestorPf =/const backoffice =/g' packages/database/prisma/fix-papel.ts
sed -i 's/prisma.gestorPF/prisma.backoffice/g' packages/database/prisma/limpar-banco.ts
```

### Corrigir Comentários
```bash
find apps/web/app/api/v1/backoffice -name "*.ts" -type f -exec sed -i 's/gestor-pf/backoffice/g' {} \;
```

---

**Status:** ⚠️ **REQUER ATENÇÃO IMEDIATA**  
**Próxima Ação:** Corrigir itens críticos antes de qualquer deploy  
**Prazo:** Imediato para crítico, 24h para alta prioridade