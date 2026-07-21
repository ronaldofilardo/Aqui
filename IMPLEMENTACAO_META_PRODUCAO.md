# Implementação Meta e Produção - Comerciais

## Resumo da Implementação

Implementada funcionalidade para gerenciar **Meta** e **Produção** na tabela de comerciais, onde cada comercial agora possui duas linhas com campos formatados como moeda brasileira.

---

## Mudanças Realizadas

### 1. Backend - Schema (`packages/shared/src/schemas.ts`)

**Antes:**
```typescript
export const upsertMetaComercialSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
  valorMeta: z.union([z.string(), z.number()])
    .refine((val) => { /* validação */ }, { message: "Valor da meta deve ser >= 0" }),
});
```

**Depois:**
```typescript
export const upsertMetaComercialSchema = z
  .object({
    mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
    valorMeta: z.union([z.string(), z.number()])
      .refine((val) => { /* validação */ }, { message: "Valor da meta deve ser >= 0" })
      .optional(),
    valorAtingido: z.union([z.string(), z.number()])
      .refine((val) => { /* validação */ }, { message: "Valor da produção deve ser >= 0" })
      .optional(),
  })
  .refine((data) => data.valorMeta !== undefined || data.valorAtingido !== undefined, {
    message: "Informe valorMeta ou valorAtingido",
  });
```

**Mudanças:**
- ✅ Adicionado campo `valorAtingido` (Produção) opcional
- ✅ `valorMeta` também opcional
- ✅ Validação: requer pelo menos um dos campos

---

### 2. Backend - API Route (`apps/web/app/api/v1/backoffice/comerciais/[id]/metas/route.ts`)

**Antes:**
```typescript
const valorMetaNum = typeof parsed.data.valorMeta === "string"
  ? parseFloat(parsed.data.valorMeta) : parsed.data.valorMeta;

const meta = await prisma.metaComercial.upsert({
  where: { /* ... */ },
  create: {
    comercialId: params.id,
    mesReferencia: parsed.data.mesReferencia,
    valorMeta: valorMetaNum,
    valorAtingido: 0,
  },
  update: {
    valorMeta: valorMetaNum,
  },
});
```

**Depois:**
```typescript
const valorMetaNum = parsed.data.valorMeta !== undefined
  ? typeof parsed.data.valorMeta === "string"
    ? parseFloat(parsed.data.valorMeta) : parsed.data.valorMeta
  : undefined;

const valorAtingidoNum = parsed.data.valorAtingido !== undefined
  ? typeof parsed.data.valorAtingido === "string"
    ? parseFloat(parsed.data.valorAtingido) : parsed.data.valorAtingido
  : undefined;

const meta = await prisma.metaComercial.upsert({
  where: { /* ... */ },
  create: {
    comercialId: params.id,
    mesReferencia: parsed.data.mesReferencia,
    valorMeta: valorMetaNum ?? 0,
    valorAtingido: valorAtingidoNum ?? 0,
  },
  update: {
    ...(valorMetaNum !== undefined ? { valorMeta: valorMetaNum } : {}),
    ...(valorAtingidoNum !== undefined ? { valorAtingido: valorAtingidoNum } : {}),
  },
});
```

**Mudanças:**
- ✅ Processa ambos os campos (`valorMeta` e `valorAtingido`)
- ✅ Update condicional: não sobrescreve um campo quando só o outro é alterado
- ✅ Audit log inclui ambos os valores

---

### 3. Frontend - Componente (`apps/web/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais.tsx`)

#### 3.1. Novas Funções Utilitárias

```typescript
function formatarMoeda(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  const numero = Number(numeros) / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoeda(valor: string): string {
  const numeros = valor.replace(/\./g, "").replace(",", ".");
  return numeros;
}
```

**Propósito:**
- `formatarMoeda()`: Formata enquanto digita (ex: `"123456"` → `"1.234,56"`)
- `parseMoeda()`: Converte para número antes de salvar (ex: `"1.234,56"` → `"1234.56"`)

#### 3.2. Novos Estados

```typescript
const [producaoInputs, setProducaoInputs] = useState<Record<string, Record<string, string>>>({});
const [producaoAlteradas, setProducaoAlteradas] = useState<Set<string>>(new Set());
```

**Propósito:**
- Gerenciar valores de produção separadamente das metas
- Controlar quais campos de produção foram alterados

#### 3.3. Novos Handlers

```typescript
function handleChangeProducao(comercialId: string, mes: string, valor: string) {
  const valorFormatado = formatarMoeda(valor);
  setProducaoInputs((prev) => { /* ... */ });
  setProducaoAlteradas((prev) => { /* ... */ });
}

async function handleSalvarProducaoGeral(comercialId: string, mes: string, valor: string) {
  const valorNumerico = parseMoeda(valor);
  const num = parseFloat(valorNumerico);
  // ... validação e chamada à API
}
```

#### 3.4. Atualização do `handleSalvarTodasMetas`

**Antes:** Salvava apenas metas
**Depois:** Salva metas E produções em uma única chamada agrupada

```typescript
type Registro = { comercialId: string; mes: string; valorMeta?: string; valorAtingido?: string };
const registros = new Map<string, Registro>();

// Agrupa meta + produção do mesmo comercial/mês
metasParaSalvar.forEach(({ comercialId, mes, valor }) => {
  const key = `${comercialId}|${mes}`;
  registros.set(key, { ...(registros.get(key) || { comercialId, mes }), valorMeta: valor });
});

producoesParaSalvar.forEach(({ comercialId, mes, valor }) => {
  const key = `${comercialId}|${mes}`;
  registros.set(key, { ...(registros.get(key) || { comercialId, mes }), valorAtingido: valor });
});

// Salva tudo junto
await Promise.all(
  Array.from(registros.values()).map(async ({ comercialId, mes, valorMeta, valorAtingido }) => {
    const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
      method: "POST",
      body: JSON.stringify({
        mesReferencia: mes,
        ...(valorMeta !== undefined ? { valorMeta: parseFloat(parseMoeda(valorMeta)) } : {}),
        ...(valorAtingido !== undefined ? { valorAtingido: parseFloat(parseMoeda(valorAtingido)) } : {}),
      }),
    });
  })
);
```

#### 3.5. Layout da Tabela - Duas Linhas por Comercial

**Antes:**
```tsx
<tbody>
  {comerciais.map((c) => (
    <tr key={c.id} className="border-b hover:bg-gray-50">
      <td>{c.nome}</td>
      <td>{c.funcao}</td>
      <td>{acoes}</td>
      {mesesAno.map((m) => (
        <td><input value={metasInputs[c.id]?.[mesRef]} /></td>
      ))}
    </tr>
  ))}
</tbody>
```

**Depois:**
```tsx
<tbody>
  {comerciais.map((c) => (
    <Fragment key={c.id}>
      {/* Linha 1: Meta */}
      <tr className="hover:bg-gray-50">
        <td rowSpan={2}>{c.nome}</td>
        <td rowSpan={2}>{c.funcao}</td>
        <td rowSpan={2}>{acoes}</td>
        <td><span>Meta</span></td>
        {mesesAno.map((m) => (
          <td><input value={metasInputs[c.id]?.[mesRef]} className="w-full px-3 py-2 text-right font-mono" /></td>
        ))}
      </tr>
      {/* Linha 2: Produção */}
      <tr className="border-b hover:bg-gray-50">
        <td><span>Produção</span></td>
        {mesesAno.map((m) => (
          <td><input value={producaoInputs[c.id]?.[mesRef]} className="w-full px-3 py-2 text-right font-mono bg-blue-50/40" /></td>
        ))}
      </tr>
    </Fragment>
  ))}
</tbody>
```

**Mudanças:**
- ✅ `Fragment` para agrupar duas linhas por comercial
- ✅ `rowSpan={2}` nas colunas fixas (Comercial, Função, Ações)
- ✅ Labels "Meta" e "Produção" em coluna separada
- ✅ Inputs de produção com fundo azulado (`bg-blue-50/40`)
- ✅ Inputs com `font-mono` e `text-right` para alinhamento numérico

#### 3.6. Expansão do Layout Horizontal

**Antes:**
```tsx
<div className="overflow-y-auto overflow-x-hidden flex-grow max-h-[600px]">
  <table className="w-full text-sm table-fixed">
```

**Depois:**
```tsx
<div className="overflow-x-auto flex-grow max-h-[600px]">
  <table className="w-full text-sm table-auto min-w-[1800px]">
```

**Mudanças:**
- ✅ `overflow-x-auto` em vez de `overflow-x-hidden` (permite scroll horizontal)
- ✅ `table-auto` em vez de `table-fixed` (colunas com largura dinâmica)
- ✅ `min-w-[1800px]` para garantir expansão horizontal
- ✅ Colunas de meses com `w-[120px]` cada (mais espaço para valores de 10 caracteres)

---

## Arquivos de Teste Criados

### ✅ `moeda-formatacao.test.ts` (18 testes passando)
Testes unitários para as funções de formatação de moeda.

### ✅ `schema-meta-producao.test.ts` (13 testes passando)
Testes unitários para o schema `upsertMetaComercialSchema`.

### 📝 `comerciais-metas-producao.test.tsx`
Testes de integração do componente (aguardando configuração de mocks).

### 📝 `comerciais-metas-producao-api.test.ts`
Testes de integração da API (aguardando configuração de mocks do NextAuth).

---

## Critérios de Aceitação Atendidos

| Critério | Status |
|----------|--------|
| Valores formatados como `[xxx.xxx,xx]` | ✅ |
| Cada comercial tem 2 linhas (Meta/Produção) | ✅ |
| Campos com largura para 10 caracteres | ✅ |
| Tabela ocupa 1800px horizontalmente | ✅ |
| Scroll horizontal habilitado | ✅ |
| Salvamento individual (onBlur) | ✅ |
| Salvamento em lote | ✅ |
| Produção com fundo azulado | ✅ |
| API salva meta e produção separadamente | ✅ |
| Schema valida ambos campos | ✅ |
| Testes passando | ✅ (31 testes) |

---

## Como Testar Manualmente

1. Acesse `/backoffice/comissionamento`
2. Role até a tabela "Comerciais Cadastrados - Metas Anual"
3. Observe que cada comercial tem duas linhas:
   - **Linha 1**: Meta (campos brancos)
   - **Linha 2**: Produção (campos com fundo azulado)
4. Digite valores nos campos (ex: `123456`)
5. Observe a formatação automática (`1.234,56`)
6. Ao sair do campo (blur), o valor é salvo automaticamente
7. Ou clique em "💾 Salvar" para salvar todas as alterações pendentes
8. O contador no botão mostra quantas alterações estão pendentes

---

## Próximos Passos

1. ✅ Implementação concluída
2. ✅ Testes unitários passando (31/31)
3. 📝 Executar testes de integração (requer mocks)
4. 📝 Testar em ambiente de staging com dados reais
5. 📝 Coletar feedback dos usuários

---

## Impacto no Banco de Dados

**Nenhuma mudança necessária!** O campo `valorAtingido` já existia no modelo `MetaComercial`:

```prisma
model MetaComercial {
  id              String   @id @default(cuid())
  comercialId     String
  mesReferencia   String
  valorMeta       Float
  valorAtingido   Float
  // ... outros campos
}
```

A implementação apenas passou a utilizar este campo existente.