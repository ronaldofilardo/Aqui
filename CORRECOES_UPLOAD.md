# Correções Upload de Planilhas - Julho 2026

## Problemas Identificados

1. **Linhas 4, 5, 6+ não eram lidas** - O código usava `range: 1` fixo, assumindo que sempre havia um título na linha 1
2. **Órfãos não eram importados** - Procedimentos sem parceiro ativo eram pulados com `continue`
3. **Duplicidade incorreta** - Usava CPF na chave de duplicidade, impedindo família com mesmo CPF

## Correções Aplicadas

### 1. Detecção Dinâmica de Cabeçalho

**Arquivos:** `apps/web/app/api/v1/gestor-pf/uploads/preview/route.ts` e `route.ts`

**Antes:**
```typescript
const rawData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: "",
  range: 1 // Sempre pulava linha 1
});

const headerRow = rawData[0];
const dataRows = rawData.slice(1);
```

**Depois:**
```typescript
const allRows = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: "",
  range: 0 // Lê todas as linhas
});

// Detecta se precisa pular título
let startRow = 0;
const firstRow = allRows[0];
if (!firstRow.some(cell => String(cell).includes("Data de Referência"))) {
  startRow = 1; // Pula título
}

const headerRow = allRows[startRow];
const dataRows = allRows.slice(startRow + 1);
```

**Resultado:** Agora lê corretamente planilhas com ou sem linha de título.

---

### 2. Órfãos São Importados

**Arquivos:** `apps/web/app/api/v1/gestor-pf/uploads/preview/route.ts` e `route.ts`

**Antes:**
```typescript
if (!indicado || indicado.status === "DESVINCULADO") {
  totalOrfao++;
  continue; // ❌ PULAVA a linha
}

if (!indicado.parceiro || indicado.parceiro.status === "DESLIGADO") {
  totalOrfao++;
  continue; // ❌ PULAVA a linha
}
```

**Depois:**
```typescript
const isOrfao = !indicado || 
  indicado.status === "DESVINCULADO" ||
  !indicado.parceiro ||
  indicado.parceiro.status === "DESLIGADO" ||
  indicado.parceiro.gestorPfId !== gestorPfId;

// Não usa continue - importa mesmo sendo órfão
procedimentos.push({
  // ...dados...
  parceiroId: isOrfao ? null : indicado.parceiro.id,
  indicadoId: isOrfao ? null : indicado.id,
});

if (isOrfao) {
  totalOrfao++;
} else {
  totalValido++;
}
```

**Resultado:** Procedimentos órfãos são importados mas marcados como "ORFÃO" no preview.

---

### 3. Chave de Duplicidade com Paciente

**Arquivos:** `apps/web/app/api/v1/gestor-pf/uploads/preview/route.ts` e `route.ts`

**Antes:**
```typescript
const uniqueKey = `${dataRef}|${cpf}|${procedimento}|${unidade}`;
// ❌ Mesmo CPF = duplicado (não permite família)
```

**Depois:**
```typescript
const uniqueKey = `${dataRef}|${paciente}|${procedimento}|${unidade}`;
// ✅ Mesmo CPF com paciente diferente = único (permite família)
```

**Resultado:**
- ✅ Permite múltiplos pacientes com mesmo CPF no mesmo dia
- ✅ Permite mesmo paciente com procedimentos diferentes no mesmo dia
- ❌ Rejeita mesmo paciente com mesmo procedimento no mesmo dia (duplicado real)

---

## Testes

Arquivo: `apps/web/app/__tests__/upload-planilha-correcoes.test.ts`

**12 testes cobrindo:**
- Detecção dinâmica de cabeçalho (3 testes)
- Chave de duplicidade com paciente (3 testes)
- Órfãos sendo importados (4 testes)
- Parse de números e CPFs (2 testes)

**Comando para rodar:**
```bash
npx vitest run apps/web/app/__tests__/upload-planilha-correcoes.test.ts
```

---

## Exemplo de Planilha Correta

```
Linha 1: Receita Bruta Analítica                    (título - pulado)
Linha 2: Data Ref | Data Pagto | ... | CPF | ...    (cabeçalho)
Linha 3: 2026-07-06 | ... | Marcia | ...            (dado 1)
Linha 4: 2026-07-06 | ... | Rosangela | ...         (dado 2)
Linha 5: 2026-07-06 | ... | Camila | ...            (dado 3)
Linha 6: 2026-07-06 | ... | ELIDIANE | ...          (dado 4 - órfão)
Linha 7: 2026-07-06 | ... | Leaci | ...             (dado 5)
Linha 8: 2026-07-06 | ... | Leaci | ...             (dado 6)
Linha 9: 2026-07-06 | ... | Leaci | ...             (dado 7)
```

**Todas as linhas 3-9 são agora lidas e processadas corretamente.**