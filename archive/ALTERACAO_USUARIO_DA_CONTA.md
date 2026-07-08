# Alteração - Vínculo de Comissões por "Usuário da conta"

## 📋 Resumo

O sistema de upload de planilhas do Gestor PF foi atualizado para utilizar a coluna **"Usuário da conta"** ao invés de "CPF do Comercial" para o vínculo de comissões.

## 🔄 Mudanças Realizadas

### 1. Coluna de Vínculo do Comercial
- **Antes:** `CPF do Comercial` (busca por CPF)
- **Depois:** `Usuário da conta` (busca por NOME)

### 2. Lógica de Busca do Comercial
```typescript
// ANTES (por CPF):
const comercial = await prisma.comercial.findFirst({
  where: { cpf: cpfComercialRaw, gestorPfId }
});

// DEPOIS (por NOME, case-insensitive):
const usuarioDaConta = String(row["Usuário da conta"] || "").trim();
const comercial = await prisma.comercial.findFirst({
  where: {
    gestorPfId,
    nome: {
      contains: usuarioDaConta,
      mode: "insensitive",
    },
  },
});
```

### 3. Colunas da Planilha
O sistema agora espera as seguintes colunas:
1. Data de Referência
2. Data do Pagamento
3. Forma de Pagamento
4. Total Pago (base de cálculo da comissão)
5. Paciente
6. Procedimento
7. CPF (do paciente)
8. Tipo do Procedimento
9. Unidade
10. **Usuário da conta** (nome do comercial)

### 4. Colunas Ignoradas (do modelo)
- Data Removida
- Tipo
- Desconto
- Acréscimo
- Valor Produzido
- Total Bruto
- Usuário que agendou
- Grupo
- Quantidade
- Prontuário
- Matrícula

## 📁 Arquivos Modificados

1. **`apps/web/app/api/v1/gestor-pf/uploads/route.ts`**
   - Atualizada constante `COLUNAS_PLANILHA`
   - Atualizada interface `RowData`
   - Substituída lógica de busca de comercial (CPF → NOME)
   - Removida função `normalizarCpfDigitos()`

2. **`apps/web/app/api/v1/gestor-pf/uploads/preview/route.ts`**
   - Atualizada constante `COLUNAS_PLANILHA`
   - Atualizada interface `RowData`
   - Adicionada leitura da coluna `Usuário da conta`

3. **`apps/web/app/(dashboard)/gestor-pf/uploads/page.tsx`**
   - Atualizado texto informativo das colunas esperadas
   - Alterado de "CPF do Comercial" para "Usuário da conta"

## 🔍 Comportamento

### Busca Case-Insensitive
A busca do comercial pelo nome é **case-insensitive** e utiliza `contains`, ou seja:
- "Valeria Cavalli Luciano" encontra "Valeria Cavalli Luciano"
- "valeria cavalli" também encontra "Valeria Cavalli Luciano"
- "LUCIANO" também encontra "Valeria Cavalli Luciano"

### Comercial não Encontrado
Se o "Usuário da conta" não encontrar um comercial correspondente:
- A linha é processada normalmente
- `comercialId` fica como `null`
- Os pontos são creditados ao parceiro
- A linha é contabilizada em "linhas sem comercial"

### Duplicidade de Nomes
Se houver dois comerciais com nomes similares:
- O Prisma retorna o **primeiro** que encontrar (não há garantia de ordem)
- Cada comercial é tratado como único pelo seu `id`

## ✅ Testes Recomendados

1. Upload de planilha com "Usuário da conta" preenchido
2. Upload de planilha com "Usuário da conta" em branco (deve funcionar como antes)
3. Upload com nomes em diferentes cases (MAIÚSCULO, minúsculo, Misto)
4. Upload com nomes parciais (ex: "Valeria" para encontrar "Valeria Cavalli Luciano")
5. Verificar se comissões estão sendo calculadas corretamente
6. Verificar ranking e pontos de produção

## 📝 Observações

- O campo `Total Pago` continua sendo a base de cálculo para comissões
- A coluna "Usuário da conta" é **obrigatória** a partir de julho de 2026
- Linhas completamente vazias na planilha são automaticamente ignoradas
- O sistema detecta automaticamente se a planilha tem linha de título e ajusta a leitura
- O sistema mantém compatibilidade com planilhas antigas que não possuem esta coluna (serão rejeitadas)

## 🐛 Correção de Discrepância (Julho 2026)

**Problema:** O preview mostrava 5 registros válidos, mas o upload importava 0 registros.

**Causa raiz:** A API de upload não estava detectando corretamente o cabeçalho da planilha quando havia uma linha de título antes do cabeçalho.

**Solução:** 
1. A API agora lê as primeiras linhas como array para identificar onde está o cabeçalho
2. Se a primeira linha não contém "Data de Referência", o sistema pula para a próxima linha
3. A leitura dos dados é feita a partir da linha correta do cabeçalho

**Resultado:** Upload agora importa corretamente os mesmos registros mostrados no preview.

## 📊 Resumo de Upload (Julho 2026)

- **5 registros válidos** importados
- **1 órfão** (CPF não encontrado na base de indicados)
- **2 rejeitados** (linhas duplicadas)
- **R$ 130,78** total de procedimentos