# Correção: Sidebar Produção não populava dados após import de planilha

## Problema
O sistema importava planilhas corretamente (status CONCLUIDO, 3 processados, 0 rejeitados, 0 órfãos), mas os dados não apareciam nas subabas do sidebar 'Produção':
- Procedimentos
- Relatórios  
- Pagamentos

## Causa Raiz
A API `/api/v1/gestor-pf/producao/route.ts` estava usando um filtro inadequado:

```typescript
// ANTES (incorreto)
const where: Record<string, unknown> = {
  parceiroId: { not: null },
  parceiro: {
    gestorPfId,
  },
};
```

O Prisma não suporta filtrar por relação aninhada desta forma em todas as situações.

## Atualização: Relatório Agrupado por Função (2026-07-06)

### Nova Funcionalidade

O **Relatório de Comissões** agora permite:

1. **Visualizar comissões agrupadas por função**
   - Cards coloridos mostram o total de comissões por função
   - Ranking com medalhas (🥇🥈🥉) para as 3 primeiras funções
   - Exibe quantidade de comerciais por função

2. **Filtrar por função**
   - Novo dropdown "Função" na seção de filtros
   - Filtra tanto o resumo quanto a tabela de comissões
   - O filtro de "Comercial" é atualizado dinamicamente baseado na função selecionada

3. **Funções disponíveis** (exemplos):
   - Gerente Cire
   - Supervisor Ativo
   - Supervisor Receptivo
   - Supervisor Franquia
   - Supervisor Atendimento
   - Gerente Atendimento
   - Supervisor Comercial

### Como Usar

1. Acesse `/gestor-pf/producao/relatorios`
2. Selecione o período (ex: `2026-07` a `2026-07`)
3. **Opcional:** Selecione uma função no dropdown "Função"
4. Clique em "🔍 Buscar"
5. **Resultado:**
   - **Resumo por Função:** Cards mostrando totais por função
   - **Tabela:** Comissões individuais com coluna "Função"

### Exemplo de Visualização

```
📊 Resumo por Função
┌─────────────────────────────────────────────────────────┐
│ 🥇 Gerente Cire              🥈 Supervisor Ativo       │
│ 3 comerciais                 2 comerciais              │
│ R$ 245,50                    R$ 180,30                 │
│ Vendas: R$ 2.455,00          Vendas: R$ 1.803,00       │
│ 3 lançamentos                2 lançamentos             │
└─────────────────────────────────────────────────────────┘
```

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/app/api/v1/gestor-pf/relatorio-comissoes/route.ts` | Adicionado agrupamento `porFuncao` e filtro por função |
| `apps/web/app/(dashboard)/gestor-pf/producao/relatorios/page.tsx` | UI para resumo por função, filtro, formatação |

---

## Solução Implementada (Original)

### 1. Arquivo: `apps/web/app/api/v1/gestor-pf/producao/route.ts`

Alterado para buscar primeiro os IDs dos parceiros do gestor e depois filtrar os procedimentos usando `in`:

```typescript
// Busca os IDs dos parceiros deste gestor para filtrar os procedimentos
const parceirosDoGestor = await prisma.parceiro.findMany({
  where: { gestorPfId },
  select: { id: true },
});

const parceiroIds = parceirosDoGestor.map(p => p.id);

const where: Record<string, unknown> = {
  parceiroId: parceiroIds.length > 0 ? { in: parceiroIds } : undefined,
};
```

## Fluxo de Dados Corrigido

```
1. Upload da Planilha (gestor-pf/uploads)
   ↓
2. Validação e Criação de ProcedimentoPF
   - Cadastra com parceiroId e indicadoId
   - Calcula comissões para comerciais
   ↓
3. API Produção (gestor-pf/producao)
   - Busca parceiros do gestor
   - Filtra procedimentos por parceiroIds IN (...)
   ↓
4. Sidebar Produção popula corretamente:
   - ✅ Procedimentos (lista completa)
   - ✅ Relatórios (comissões por comercial)
   - ✅ Pagamentos (gestão de pagamentos)
```

### 2. Arquivo: `apps/web/app/api/v1/gestor-pf/relatorio-comissoes/route.ts`

**Problema:** Filtro `comercial.gestorPfId` não funcionava corretamente.

**Solução:** Buscar IDs dos comerciais primeiro:

```typescript
// Busca os IDs dos comerciais deste gestor para filtrar as comissões
const comerciaisDoGestor = await prisma.comercial.findMany({
  where: { gestorPfId },
  select: { id: true },
});

const comercialIds = comerciaisDoGestor.map(c => c.id);

const where: any = {
  comercialId: comercialIds.length > 0 ? { in: comercialIds } : undefined,
  mesReferencia: {
    gte: inicio,
    lte: fim,
  },
};
```

### 3. Arquivo: `apps/web/app/api/v1/gestor-pf/comissoes/lista/route.ts`

**Problema:** Mesmo problema - filtro `comercial.gestorPfId` não funcionava.

**Solução:** Aplicada a mesma abordagem:

```typescript
// Busca os IDs dos comerciais deste gestor para filtrar as comissões
const comerciaisDoGestor = await prisma.comercial.findMany({
  where: { gestorPfId },
  select: { id: true },
});

const comercialIds = comerciaisDoGestor.map(c => c.id);

const where: any = {
  comercialId: comercialIds.length > 0 ? { in: comercialIds } : undefined,
};
```

## APIs Envolvidas

Todas as APIs foram corrigidas:

| API | Status | Observação |
|-----|--------|------------|
| `/api/v1/gestor-pf/producao` | **CORRIGIDA** | Filtro por `parceiroIds IN (...)` |
| `/api/v1/gestor-pf/relatorio-comissoes` | **CORRIGIDA** | Filtro por `comercialIds IN (...)` |
| `/api/v1/gestor-pf/comissoes/lista` | **CORRIGIDA** | Filtro por `comercialIds IN (...)` |

## Testes Sugeridos

1. **Importar nova planilha** como `gestor-pf@asa.com`
2. **Acessar** `/gestor-pf/producao/procedimentos`
3. **Verificar** se os 3 procedimentos aparecem na tabela
4. **Acessar** `/gestor-pf/producao/relatorios`
5. **Selecionar período** e verificar comissões
6. **Acessar** `/gestor-pf/producao/pagamentos`
7. **Verificar** comissões calculadas disponíveis para pagamento

## Notas Importantes

### Sobre Comissões e Relatórios

Se as abas **Relatórios** e **Pagamentos** estiverem vazias, isso pode ser **esperado** dependendo dos dados importados:

1. **Comissões só são criadas se:**
   - A planilha tiver a coluna **"CPF do Comercial"** preenchida
   - O CPF do Comercial estiver cadastrado no sistema (`Comercial` model)
   - O Comercial estiver vinculado ao mesmo `gestorPfId`

2. **Se a planilha não tem "CPF do Comercial":**
   - ✅ Procedimentos são criados normalmente
   - ⚠️ Comissões **NÃO** são criadas
   - ⚠️ Relatórios e Pagamentos ficarão vazios

3. **Como verificar:**
   - Acesse `/gestor-pf/uploads` e veja o upload
   - Verifique os contadores: `linhasComComercial` vs `linhasSemComercial`
   - Se `linhasSemComercial > 0`, essas linhas não geraram comissões

4. **Como criar comissões manualmente:**
   - Cadastre um comercial em `/gestor-pf/comerciais`
   - Re-importe a planilha com a coluna "CPF do Comercial" preenchida
   - Ou execute o script de recálculo de comissões (se disponível)

### Dados do Seu Caso Atual

Com base nos logs e dados fornecidos:

- ✅ **Upload**: `Receita Bruta Análitica01.xlsx` - CONCLUIDO
- ✅ **Procedimentos**: 3 procedimentos criados (R$ 807,00 total)
- ⚠️ **Comerciais**: 1 comercial cadastrado ("Testes Ger Cire" - 047.030.849-45)
- ⚠️ **Comissões**: 0 comissões criadas (planilha sem "CPF do Comercial")

**Por que não há comissões?**

A planilha importada **não continha a coluna "CPF do Comercial"** preenchida. O sistema só cria comissões quando:
1. A coluna "CPF do Comercial" existe na planilha
2. O CPF informado corresponde a um comercial cadastrado
3. O comercial está ativo e vinculado ao gestor correto

**Solução para testar comissões:**

1. **Opção A: Re-importar planilha com CPF do Comercial**
   - Adicione uma coluna "CPF do Comercial" na planilha
   - Preencha com o CPF: `04703084945` (comercial "Testes Ger Cire")
   - Re-importe em `/gestor-pf/uploads`

2. **Opção B: Criar comissão manualmente via banco de dados**
   ```sql
   INSERT INTO comissoes_comerciais (id, comercial_id, mes_referencia, valor_vendas, valor_comissao, status, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     (SELECT id FROM comerciais WHERE cpf = '04703084945'),
     '2026-07',
     807.00,
     80.70,  -- 10% de exemplo
     'CALCULADA',
     NOW(),
     NOW()
   );
   ```

3. **Opção C: Criar script de recálculo**
   - Script que lê procedimentos do mês
   - Calcula comissões baseadas nas regras
   - Cria registros em `comissoes_comerciais`

---

## Próximos Passos Sugeridos

1. ✅ **Validar Procedimentos**: Acesse `/gestor-pf/producao/procedimentos` e confirme os 3 procedimentos
2. ⬜ **Testar Comissões**: Re-importe planilha com "CPF do Comercial" ou crie comissão manualmente
3. ⬜ **Validar Relatórios**: Após criar comissões, acesse `/gestor-pf/producao/relatorios`
4. ⬜ **Validar Pagamentos**: Após criar comissões, acesse `/gestor-pf/producao/pagamentos`