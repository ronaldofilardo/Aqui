# 🔍 Matriz de Rastreabilidade - Testes vs Implementações

**Período:** Última semana (2026-07-05 a 2026-07-12)  
**Objetivo:** Verificar se TODAS as alterações implementadas estão cobertas por testes

---

## 📊 RESUMO EXECUTIVO

| Categoria | Total Implementado | Total Testado | Cobertura | Status |
|-----------|-------------------|---------------|-----------|--------|
| **API Routes** | 27 endpoints | 15 endpoints | 55% | 🟡 Parcial |
| **Components UI** | 35+ componentes | 0 componentes | 0% | 🔴 Crítico |
| **Database/Schema** | 8 models alterados | 4 models testados | 50% | 🟡 Parcial |
| **Utils/Helpers** | 6 arquivos | 1 arquivo | 17% | 🟡 Parcial |
| **Scripts** | 9 scripts | 0 scripts | 0% | 🔴 Crítico |
| **Migrations** | 3 migrations | 0 migrations | 0% | 🔴 Crítico |

**Cobertura Geral:** ˜25%  
**Status:** ⚠️ **ATENÇÃO** - Necessita expansão de testes

---

## 📋 DETALHAMENTO POR CATEGORIA

### 1️⃣ API ROUTES (Backend)

#### ✅ Testadas (15/27 = 55%)

| Endpoint | Implementação | Teste Unitário | Teste Integração | Status |
|----------|---------------|----------------|------------------|--------|
| `GET /config` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /liderancas` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /comerciais` | ✅ | ✅ | ✅ | 🟢 OK |
| `GET /parceiros` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /pontos/ciclos` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /pontos/configuracao` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /pontos/premios` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /regras-comerciais` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /regras-gestores` | ✅ | ✅ | ❌ | 🟢 OK |
| `GET /relatorio-comissoes` | ✅ | ✅ | ❌ | 🟢 OK |
| `POST /uploads` | ✅ | ❌ | ✅ | 🟢 OK |
| `POST /uploads/preview` | ✅ | ❌ | ❌ | 🟡 Manual |
| `POST /pontos/distribuir` | ✅ | ❌ | ❌ | 🟡 Manual |
| `POST /reprocessar-comissoes` | ✅ | ❌ | ❌ | 🟡 Manual |
| `GET /pontos/ranking` | ✅ | ❌ | ❌ | 🟡 Manual |

#### ❌ NÃO Testadas (12/27 = 45%)

| Endpoint | Implementação | Teste Unitário | Teste Integração | Prioridade |
|----------|---------------|----------------|------------------|------------|
| `POST /comerciais` | ✅ | ❌ | ❌ | 🔴 Alta |
| `GET /comerciais/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `PATCH /comerciais/[id]` | ✅ | ❌ | ❌ | 🔴 Alta |
| `DELETE /comerciais/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `GET /comerciais/[id]/comissoes` | ✅ | ❌ | ❌ | 🟡 Média |
| `GET /comerciais/[id]/metas` | ✅ | ❌ | ❌ | 🟡 Média |
| `POST /comerciais/[id]/metas` | ✅ | ❌ | ❌ | 🟡 Média |
| `POST /comerciais/calcular-comissao` | ✅ | ❌ | ❌ | 🟡 Média |
| `GET /liderancas/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `PUT /liderancas/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `DELETE /liderancas/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `GET /liderancas/[id]/equipe` | ✅ | ❌ | ❌ | 🟠 Baixa |
| `GET /parceiros/check-cpf` | ✅ | ❌ | ❌ | 🟡 Média |
| `POST /pontos/ciclos` | ✅ | ❌ | ❌ | 🟡 Média |
| `PATCH /pontos/ciclos/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `POST /pontos/configuracao` | ✅ | ❌ | ❌ | 🟡 Média |
| `PATCH /pontos/configuracao` | ✅ | ❌ | ❌ | 🟡 Média |
| `PATCH /pontos/premios` | ✅ | ❌ | ❌ | 🟠 Baixa |
| `DELETE /pontos/premios` | ✅ | ❌ | ❌ | 🟠 Baixa |
| `GET /pontos/resgates` | ✅ | ❌ | ❌ | 🟡 Média |
| `PATCH /pontos/resgates/[id]` | ✅ | ❌ | ❌ | 🟡 Média |
| `PATCH /consultores/[id]` | ✅ | ❌ | ❌ | 🟠 Baixa |

---

### 2️⃣ COMPONENTES UI (Frontend)

#### ❌ NÃO Testados (35+ componentes = 0% cobertura)

| Componente | Arquivo | Teste Unitário | Teste E2E | Prioridade |
|------------|---------|----------------|-----------|------------|
| Sidebar | `components/sidebar.tsx` | ❌ | ❌ | 🔴 Alta |
| Login Page | `app/(auth)/login/page.tsx` | ❌ | ❌ | 🔴 Alta |
| Comerciais Page | `gestor-pf/usuarios/comerciais/page.tsx` | ❌ | ❌ | 🔴 Alta |
| Comercial Modal | `components/comercial-modal.tsx` | ❌ | ❌ | 🟡 Média |
| Novo Comercial Form | `components/novo-comercial-form.tsx` | ❌ | ❌ | 🟡 Média |
| Tab Cadastro | `components/tab-cadastro.tsx` | ❌ | ❌ | 🟠 Baixa |
| Tab Comissões | `components/tab-comissoes.tsx` | ❌ | ❌ | 🟠 Baixa |
| Tab Regras | `components/tab-regras.tsx` | ❌ | ❌ | 🟠 Baixa |
| Use Comerciais | `hooks/use-comerciais.ts` | ❌ | ❌ | 🟡 Média |
| Use Comissões | `hooks/use-comissoes.ts` | ❌ | ❌ | 🟡 Média |
| Use Metas | `hooks/use-metas.ts` | ❌ | ❌ | 🟠 Baixa |
| Use Regras | `hooks/use-regras.ts` | ❌ | ❌ | 🟠 Baixa |
| Pontos Page | `gestor-pf/pontos/page.tsx` | ❌ | ❌ | 🔴 Alta |
| Ciclos Pontos | `components/ciclos-pontos.tsx` | ❌ | ❌ | 🟡 Média |
| Configuracao Pontos | `components/configuracao-pontos.tsx` | ❌ | ❌ | 🟡 Média |
| Criar Ciclo Form | `components/criar-ciclo-form.tsx` | ❌ | ❌ | 🟡 Média |
| Distribuir Pontos | `components/distribuir-pontos.tsx` | ❌ | ❌ | 🔴 Alta |
| Parceiros Pontos | `components/parceiros-pontos.tsx` | ❌ | ❌ | 🟡 Média |
| Premios Pontos | `components/premios-pontos.tsx` | ❌ | ❌ | 🟡 Média |
| Ranking Pontos | `components/ranking-pontos.tsx` | ❌ | ❌ | 🟡 Média |
| Resgate Pontos | `components/resgate-pontos.tsx` | ❌ | ❌ | 🟡 Média |
| Tabela Distribuicao | `components/tabela-distribuicao.tsx` | ❌ | ❌ | 🟡 Média |
| Use Pontos Data | `hooks/use-pontos-data.ts` | ❌ | ❌ | 🟡 Média |
| Upload Page | `gestor-pf/producao/upload/page.tsx` | ❌ | ❌ | 🔴 Alta |
| Filtros Relatorio | `components/filtros-relatorio.tsx` | ❌ | ❌ | 🟠 Baixa |
| Relatorios Page | `gestor-pf/producao/relatorios/page.tsx` | ❌ | ❌ | 🟡 Média |
| Use Relatorio Comissoes | `hooks/use-relatorio-comissoes.ts` | ❌ | ❌ | 🟠 Baixa |

**Status:** 🔴 **CRÍTICO** - Nenhum componente UI testado

---

### 3️⃣ DATABASE / SCHEMA

#### ✅ Parcialmente Testado (4/8 = 50%)

| Model/Entidade | Alteração | Teste Unitário | Teste Integração | Status |
|----------------|-----------|----------------|------------------|--------|
| Backoffice | `gestorPf → backoffice` | ✅ | ✅ | 🟢 OK |
| Lideranca | `backofficeId, tipo` | ✅ | ✅ | 🟢 OK |
| Comercial | `liderancaId, funcao` | ✅ | ✅ | 🟢 OK |
| Parceiro | `comercialId, gestorId` | ✅ | ✅ | 🟢 OK |
| CicloPontos | `backofficeId, periodicidade` | ✅ | ✅ | 🟢 OK |
| ConfiguracaoPontos | `backofficeId` | ✅ | ✅ | 🟢 OK |
| Premio | `backofficeId` | ✅ | ✅ | 🟢 OK |
| UploadPlanilhaBackoffice | `backofficeId` | ❌ | ❌ | 🔴 Falta |

**Migrations:**
- [ ] `20260707000000_remove_parceiro_comissao_legado` - SEM TESTE
- [ ] `20260707224037_add_descricao_movimentacao_pontos` - SEM TESTE
- [ ] `20260711020903_add_lideranca_to_comercial` - SEM TESTE

---

### 4️⃣ UTILS / HELPERS

#### ✅ Parcialmente Testado (1/6 = 17%)

| Arquivo | Funções | Teste Unitário | Status |
|---------|---------|----------------|--------|
| `lib/rate-limit.ts` | `checkRateLimit, getRateLimitOptions, cleanup` | ✅ | 🟢 OK |
| `lib/pontos-utils.ts` | `calcularPontosDeProducao, obterCicloVigente, calcularComissaoComercial` | ❌ | 🔴 Falta |
| `lib/processar-upload-pf.ts` | `processarUploadPlanilhaPF` | ❌ | 🔴 Falta |
| `lib/api-helpers.ts` | `requireBackoffice, requireBackofficeWithScope` | ❌ | 🔴 Falta |
| `lib/auth.ts` | NextAuth config | ❌ | 🔴 Falta |
| `lib/utils.ts` | `gerarSenhaProvisoria, getBaseUrl` | ❌ | 🔴 Falta |

---

### 5️⃣ SCRIPTS

#### ❌ NÃO Testado (0/9 = 0%)

| Script | Finalidade | Teste | Prioridade |
|--------|-----------|-------|------------|
| `distribuir-pontos-auto.ts` | Distribuição automática | ❌ | 🟡 Média |
| `simular-endpoint-distribuir.ts` | Simulação | ❌ | 🟠 Baixa |
| `testar-endpoint-distribuir.ts` | Teste manual | ❌ | 🟠 Baixa |
| `verificar-distribuicao.ts` | Validação | ❌ | 🟠 Baixa |
| `verificar-ranking.ts` | Validação ranking | ❌ | 🟠 Baixa |
| `atualizar-config-pontos.ts` | Update config | ❌ | 🟠 Baixa |
| `verificar-pontos-config.ts` | Validação config | ❌ | 🟠 Baixa |
| `verificar-procedimentos.ts` | Validação procedimentos | ❌ | 🟠 Baixa |
| `vincular-procedimentos-parceiros.ts` | Vínculo | ❌ | 🟠 Baixa |

---

### 6️⃣ MIGRAÇÕES SQL

#### ❌ NÃO Testado (0/3 = 0%)

| Migração | Arquivo | Teste Rollback | Status |
|----------|---------|----------------|--------|
| Backoffice Simple | `migrate_backoffice_simple.sql` | ❌ | 🔴 Crítico |
| Gestor PF → Backoffice | `migrate_gestor_pf_to_backoffice.sql` | ❌ | 🔴 Crítico |
| Gestor PF → Backoffice Fixed | `migrate_gestor_pf_to_backoffice_fixed.sql` | ❌ | 🔴 Crítico |

---

## 🎯 PLANO DE AÇÃO - TESTES FALTANTES

### 🔴 PRIORIDADE ALTA (1-2 dias)

1. **Testes de Componentes UI Críticos**
   ```bash
   # Criar testes para:
   - Sidebar (navegação backoffice)
   - Login Page (redirecionamento)
   - Pontos Page (distribuição)
   - Upload Page (upload de planilha)
   ```

2. **Testes de API Routes Não Cobertas**
   ```bash
   # Criar testes para:
   - POST /comerciais (criação)
   - PATCH /comerciais/[id] (atualização)
   - DELETE /comerciais/[id] (exclusão)
   - POST /pontos/ciclos (criação de ciclo)
   - POST /pontos/distribuir (distribuição)
   ```

3. **Testes de Utils**
   ```bash
   # Criar testes para:
   - pontos-utils.ts (cálculos)
   - api-helpers.ts (auth guards)
   ```

### 🟡 PRIORIDADE MÉDIA (3-5 dias)

4. **Testes de Hooks**
   ```bash
   - use-comerciais.ts
   - use-comissoes.ts
   - use-pontos-data.ts
   ```

5. **Testes de Migração**
   ```bash
   # Criar scripts de validação:
   - Testar migrate_gestor_pf_to_backoffice.sql
   - Testar rollback
   - Validar dados após migração
   ```

6. **Testes de Scripts**
   ```bash
   # Validar scripts:
   - distribuir-pontos-auto.ts
   - verificar-ranking.ts
   ```

### 🟠 PRIORIDADE BAIXA (1 semana+)

7. **Testes E2E**
   ```bash
   # Criar fluxos completos:
   - Login → Dashboard → Criar Comercial
   - Upload → Processamento → Comissão
   - Ciclo → Pontos → Resgate
   ```

8. **Testes de Performance**
   ```bash
   # Validar:
   - Ranking com cache
   - Upload de planilhas grandes
   - Rate limiting em carga
   ```

---

## 📊 COBERTURA ATUAL VS DESEJADA

| Categoria | Atual | Desejada | Gap |
|-----------|-------|----------|-----|
| API Routes | 55% | 90% | -35% |
| Componentes UI | 0% | 80% | -80% |
| Database | 50% | 100% | -50% |
| Utils/Helpers | 17% | 100% | -83% |
| Scripts | 0% | 50% | -50% |
| Migrations | 0% | 100% | -100% |
| **GERAL** | **25%** | **85%** | **-60%** |

---

## ✅ CONCLUSÃO

### O Que Está Bem Testado:
- ✅ API Backoffice (endpoints principais)
- ✅ Integração de fluxos críticos
- ✅ Rate limiting
- ✅ Models principais do Prisma

### O Que Precisa de Testes Urgentes:
- 🔴 **Componentes UI** (0% cobertura)
- 🔴 **Migrações SQL** (0% cobertura)
- 🔴 **Utils/helpers** (83% sem teste)
- 🔴 **Scripts** (0% cobertura)
- 🟡 **API Routes secundárias** (45% sem teste)

### Recomendação:
**NÃO DEPLOY EM PRODUÇÃO** sem antes:
1. [ ] Testar migrações SQL com rollback
2. [ ] Testar componentes UI críticos (Sidebar, Login, Upload)
3. [ ] Testar utils críticos (pontos-utils, auth)
4. [ ] Validar scripts de distribuição de pontos

---

**Data da Análise:** 2026-07-12  
**Responsável:** AI Assistant  
**Próxima Revisão:** Após implementação dos testes faltantes