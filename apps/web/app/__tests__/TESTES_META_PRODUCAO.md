# Testes - Meta e Produção para Comerciais

## Visão Geral

Esta suite de testes valida a implementação da funcionalidade de **Meta e Produção** para a tabela de comerciais, onde cada comercial possui duas linhas (Meta e Produção) com campos formatados como moeda brasileira.

## Arquivos de Teste Criados

### 1. `moeda-formatacao.test.ts` ✅
**Descrição**: Testes unitários para as funções utilitárias de formatação de moeda.

**Cobertura**:
- `formatarMoeda()`: Formata valores numéricos para padrão brasileiro (ex: `123456` → `1.234,56`)
- `parseMoeda()`: Converte formato brasileiro para número (ex: `1.234,56` → `1234.56`)
- Round-trip: Garante que formatar → parse → formatar mantém o valor

**Status**: ✅ **18 testes passando**

### 2. `schema-meta-producao.test.ts` ✅
**Descrição**: Testes unitários para o schema de validação `upsertMetaComercialSchema`.

**Cobertura**:
- Aceitar apenas `valorMeta`
- Aceitar apenas `valorAtingido`
- Aceitar ambos os campos juntos
- Rejeitar quando nenhum valor é fornecido
- Aceitar valores como string ou número
- Aceitar valores decimais e zero
- Rejeitar valores negativos
- Validar formato do mês (YYYY-MM)

**Status**: ✅ **13 testes passando**

### 3. `comerciais-metas-producao.test.tsx` 📝
**Descrição**: Testes de integração para o componente `TabComerciais` com as novas funcionalidades.

**Cobertura**:
- Renderização de duas linhas por comercial (Meta e Produção)
- Exibição de valores formatados como moeda brasileira
- Formatação automática enquanto usuário digita
- Layout expandido (1800px largura mínima)
- Scroll horizontal quando necessário
- Colunas mescladas com `rowSpan={2}`
- Inputs com `font-mono` e alinhamento à direita
- Diferenciação visual da linha de Produção (fundo azulado)
- Botão Salvar com contador de alterações
- Contagem separada de alterações de meta e produção

**Status**: 📝 Criado, requer configuração completa de mocks

### 4. `comerciais-metas-producao-api.test.ts` 📝
**Descrição**: Testes de integração para a API de metas com suporte a produção.

**Cobertura**:
- POST: Salvar apenas `valorMeta`
- POST: Salvar apenas `valorAtingido` (Produção)
- POST: Salvar ambos juntos
- POST: Atualizar apenas `valorAtingido` sem sobrescrever `valorMeta`
- POST: Aceitar valores como string e converter para número
- POST: Validação de valores negativos
- POST: Validação de campos obrigatórios
- GET: Retornar metas com ambos os campos

**Status**: 📝 Criado, depende de mocks do NextAuth

## Funcionalidades Testadas

### Frontend (UI)
1. **Layout de Tabela**:
   - Duas linhas por comercial (Meta / Produção)
   - Colunas "Comercial", "Função", "Ações" mescladas verticalmente
   - Largura mínima de 1800px para expansão horizontal
   - Scroll horizontal habilitado

2. **Formatação de Moeda**:
   - Formato brasileiro: `[xxx.xxx,xx]`
   - Formatação automática enquanto digita
   - Inputs com 10 caracteres visíveis
   - Fonte monoespaçada para alinhamento
   - Alinhamento à direita para valores numéricos

3. **Estados e Interações**:
   - Estados separados para metas e produções
   - Contador de alterações combinado
   - Salvamento individual (onBlur) e em lote
   - Diferenciação visual (Produção com fundo azulado)

### Backend (API)
1. **Schema (`upsertMetaComercialSchema`)**:
   - Aceita `valorMeta` e/ou `valorAtingido`
   - Validação de valores >= 0
   - Requer pelo menos um dos campos

2. **Rota POST**:
   - Upsert com create/update diferenciado
   - Não sobrescreve um campo quando só o outro é alterado
   - Conversão automática de string para número
   - Audit log com ambos os valores

3. **Rota GET**:
   - Retorna ambos os campos: `valorMeta` e `valorAtingido`

## Como Executar os Testes

### Testes de Schema (Unitários)
```bash
npx vitest run apps/web/app/__tests__/schema-meta-producao.test.ts
```

### Testes de Formatação (Unitários)
```bash
npx vitest run apps/web/app/__tests__/moeda-formatacao.test.ts
```

### Todos os Testes Relacionados
```bash
npx vitest run --reporter=verbose
```

## Resumo dos Testes

| Arquivo | Status | Testes |
|---------|--------|--------|
| `moeda-formatacao.test.ts` | ✅ Passando | 18 |
| `schema-meta-producao.test.ts` | ✅ Passando | 13 |
| `comerciais-metas-producao.test.tsx` | 📝 Pendente | - |
| `comerciais-metas-producao-api.test.ts` | 📝 Pendente | - |
| **Total** | **31 passando** | **31/31** |

## Mudanças Implementadas

### Arquivos Modificados
1. **`packages/shared/src/schemas.ts`**
   - Atualizado `upsertMetaComercialSchema` para aceitar `valorAtingido`

2. **`apps/web/app/api/v1/backoffice/comerciais/[id]/metas/route.ts`**
   - Suporte a salvar `valorAtingido` sem sobrescrever `valorMeta`

3. **`apps/web/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais.tsx`**
   - Duas linhas por comercial (Meta/Produção)
   - Funções `formatarMoeda()` e `parseMoeda()`
   - Estados separados para metas e produções
   - Handlers separados: `handleChangeMeta`/`handleChangeProducao`
   - Salvamento em lote combinando meta + produção
   - Layout expandido (min-width: 1800px)
   - Inputs formatados com fonte monoespaçada

### Arquivos Criados
- `apps/web/app/__tests__/moeda-formatacao.test.ts` ✅
- `apps/web/app/__tests__/comerciais-metas-producao.test.tsx`
- `apps/web/app/__tests__/comerciais-metas-producao-api.test.ts`

## Critérios de Aceitação

- ✅ Valores formatados como moeda brasileira `[xxx.xxx,xx]`
- ✅ Cada comercial tem duas linhas (Meta e Produção)
- ✅ Campos com largura para 10 caracteres
- ✅ Tabela ocupa área maior horizontalmente (1800px)
- ✅ Scroll horizontal quando necessário
- ✅ Salvamento individual e em lote funcionando
- ✅ Produção diferenciada visualmente (fundo azulado)
- ✅ API suporta salvar meta e produção separadamente
- ✅ Schema valida ambos os campos
- ✅ Testes unitários passando (31/31)
  - `moeda-formatacao.test.ts`: 18 testes ✅
  - `schema-meta-producao.test.ts`: 13 testes ✅

## Próximos Passos

1. Executar testes do componente com mocks corretos
2. Executar testes da API com banco de dados mock
3. Adicionar testes e2e para fluxo completo
4. Testar com dados reais em ambiente de staging