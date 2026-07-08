# 📊 Baseline de Testes - Antes da Refatoração

**Data:** 2026-07-08  
**Objetivo:** Garantir zero regressões durante refatorações

---

## ✅ Status Atual dos Testes

### Resumo
- **Test Files:** 24 passed, 3 failed (27 total)
- **Tests:** 423 passed, 1 failed (424 total)
- **Sucesso:** 99.76%

### Testes Críticos Passando ✅

#### Comercial & Comissões (9 testes)
- ✅ Comercial - Modelo & Unicidade (3)
- ✅ MetaComercial - mês único por comercial (2)
- ✅ ComissaoComercial - cálculo idempotente (2)
- ✅ ProcedimentoPF - comercialId imutável (1)
- ✅ Comissões Gestão - Página e Funcionalidades (6)

#### Gestor & Consultores (6 testes)
- ✅ GestorConsultor - Hierarchy & Authorization (6)

#### Parceiro & Pontos (5 testes)
- ✅ Parceiro - Preferência de Ciclo (5)

#### Upload & Validações (21 testes)
- ✅ Upload de Planilha - Validação de Colunas (2)
- ✅ Upload de Planilha - Parsing de Dados (5)
- ✅ Upload de Planilha - Validações de Linha (4)
- ✅ Upload de Planilha - Identificação de Comercial (2)
- ✅ Upload de Planilha - Resumo (1)

#### Segurança & Auth (15+ testes)
- ✅ Security tests
- ✅ Rate limit tests
- ✅ Middleware routing tests

#### Utilitários (10+ testes)
- ✅ API helpers tests
- ✅ Pontos utils tests
- ✅ CPF validation tests

---

## ⚠️ Testes Falhando (Pré-existentes)

### 1. `pontos-distribuicao.test.ts`
- **Erro:** `Cannot find package '@jest/globals'`
- **Causa:** Package não instalada
- **Solução:** `pnpm add -D @jest/globals`
- **Status:** ⚠️ Não bloqueia refatoração (não é teste de integração)

### 2. `pontos-gestor-pf.test.ts`
- **Erro:** `Cannot find package '@jest/globals'`
- **Causa:** Package não instalada
- **Solução:** `pnpm add -D @jest/globals`
- **Status:** ⚠️ Não bloqueia refatoração

### 3. `upload-pontos-comercial.test.ts`
- **Erro:** `Unique constraint failed on the fields: (cpf)`
- **Causa:** Teste não limpa banco corretamente entre runs
- **Solução:** Melhorar cleanup no beforeEach
- **Status:** ⚠️ Intermitente (passa em run isolado)

---

## 🔒 Critérios de Aceite para Refatoração

### Para CADA arquivo refatorado:

1. **Build deve passar:**
   ```bash
   pnpm build
   ```

2. **Testes relacionados devem passar:**
   ```bash
   npx vitest run apps/web/app/__tests__/comissoes-gestao-page.test.ts
   ```

3. **Testes de integração devem passar:**
   ```bash
   npx vitest run apps/web/app/__tests__/upload-comissoes.test.ts
   ```

4. **Teste manual rápido:**
   - Navegar até página afetada
   - Validar funcionalidades principais
   - Verificar console sem errors

---

## 📋 Checklist Pré-Refatoração

### Para cada arquivo na lista de refatoração:

- [ ] **Backup Git:** `git checkout -b refactor/nome-arquivo`
- [ ] **Documentar Comportamento:** Capturar inputs/outputs
- [ ] **Testes Passando:** Validar testes relacionados
- [ ] **Build OK:** `pnpm build` sem errors
- [ ] **Code Review:** Outro dev revisa PR

---

## 📈 Métricas de Sucesso

| Métrica | Antes | Depois | Aceitável |
|---------|-------|--------|-----------|
| Test Files Passing | 24/27 | ≥24/27 | ✅ Manter |
| Tests Passing | 423/424 | ≥423/424 | ✅ Manter |
| Build Status | ✅ OK | ✅ OK | ✅ Manter |
| Linhas (comissoes-gestao) | 1271 | <300 | ✅ Reduzir |
| Linhas (pontos-page) | 642 | <300 | ✅ Reduzir |
| Linhas (uploads-route) | 563 | <150 | ✅ Reduzir |

---

## 🛡️ Estratégia de Rollback

Se qualquer critério falhar:

1. **Abortar refatoração**
2. **Reverter branch:** `git checkout main`
3. **Deletar branch falha:** `git branch -D refactor/nome`
4. **Documentar falha:** Criar issue com learnings
5. **Re tentar:** Apenas após corrigir causa raiz

---

*Baseline criada em: 2026-07-08*  
*Responsável: Team*  
*Próxima revisão: Após cada refatoração*