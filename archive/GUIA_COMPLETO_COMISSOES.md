# Guia Completo: Importação de Planilha e Comissões por Função

## Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO DE IMPORTAÇÃO                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. UPLOAD DA PLANILHA                                                  │
│     /gestor-pf/uploads                                                  │
│     └─ Colunas obrigatórias:                                            │
│        - Data de Referência, Paciente, CPF, Procedimento, etc.          │
│        - CPF do Comercial (OPCIONAL) ← IMPORTANTE PARA COMISSÕES        │
│                                                                         │
│  2. PROCESSAMENTO                                                       │
│     API: /api/v1/gestor-pf/uploads                                      │
│     ├─ Valida CPF do paciente                                           │
│     ├─ Busca Indicado pelo CPF                                          │
│     ├─ Verifica vínculo com Parceiro                                    │
│     ├─ (OPCIONAL) Busca Comercial pelo "CPF do Comercial"               │
│     └─ Cria ProcedimentoPF com:                                         │
│        - parceiroId, indicadoId                                         │
│        - comercialId (se CPF do Comercial foi informado)                │
│                                                                         │
│  3. CÁLCULO DE COMISSÕES                                                │
│     Automático no final do upload                                       │
│     ├─ Agrupa vendas por comercial e mês                                │
│     ├─ Calcula comissão baseada na função do comercial                  │
│     └─ Cria registro em ComissaoComercial                               │
│                                                                         │
│  4. VISUALIZAÇÃO                                                        │
│     ├─ /gestor-pf/producao/procedimentos                                │
│     │  └─ Lista todos procedimentos com coluna "Comercial"              │
│     │                                                                   │
│     ├─ /gestor-pf/producao/relatorios                                   │
│     │  ├─ Filtro por FUNÇÃO (Gerente Cire, Supervisor, etc.)            │
│     │  ├─ Resumo por função (cards com 🥇🥈🥉)                           │
│     │  └─ Tabela com comissões por comercial                            │
│     │                                                                   │
│     └─ /gestor-pf/producao/pagamentos                                   │
│        └─ Gestão de pagamento de comissões                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Passo a Passo para Teste Completo

### Pré-requisitos

1. **Comercial cadastrado** com função definida
   - Acesse: `/gestor-pf/comerciais`
   - Criar comercial com função: "GERENTE_CIRE", "SUPERVISOR_ATIVO", etc.
   - Anotar o **CPF** do comercial criado

2. **Planilha preparada** com coluna "CPF do Comercial"
   - Adicionar coluna: `CPF do Comercial`
   - Preencher com o CPF do comercial cadastrado
   - Exemplo:

| Data de Referência | Paciente | CPF | Procedimento | ... | CPF do Comercial |
|-------------------|----------|-----|--------------|-----|------------------|
| 26/06/2026 | Nilce Aparecida | 479.248.280-10 | hemograma | ... | 047.030.849-45 |

---

### Teste 1: Upload com CPF do Comercial

1. **Acessar Upload:**
   ```
   http://localhost:3000/gestor-pf/uploads
   ```

2. **Selecionar arquivo Excel** com a coluna "CPF do Comercial" preenchida

3. **Clicar em "Importar"** e aguardar processamento

4. **Verificar resultado:**
   - ✅ Upload status: CONCLUIDO
   - ✅ Processados: X (número de linhas)
   - ✅ Linhas com comercial: Y (deve ser > 0 se CPF foi preenchido)

---

### Teste 2: Verificar Procedimentos com Comercial

1. **Acessar Procedimentos:**
   ```
   http://localhost:3000/gestor-pf/producao/procedimentos
   ```

2. **Verificar tabela:**
   - Deve haver coluna **"Comercial"**
   - Cada procedimento deve mostrar:
     - Nome do comercial
     - Função do comercial (ex: "Gerente Cire")

3. **Exemplo de visualização:**

| Data | Paciente | ... | Parceiro | **Comercial** | ... |
|------|----------|-----|----------|---------------|-----|
| 26/06/2026 | Nilce Aparecida | ... | Parceiro teste | **Testes Ger Cire**<br><small>Gerente Cire</small> | ... |

---

### Teste 3: Verificar Relatório por Função

1. **Acessar Relatórios:**
   ```
   http://localhost:3000/gestor-pf/producao/relatorios
   ```

2. **Selecionar período:**
   - Período Inicial: `2026-07`
   - Período Final: `2026-07`

3. **Clicar em "🔍 Buscar"**

4. **Verificar Resumo por Função:**
   - Cards coloridos devem aparecer
   - Exemplo:
     ```
     🥇 Gerente Cire
     1 comercial
     R$ 80,70
     Vendas: R$ 807,00 • 1 lançamento
     ```

5. **Testar Filtro por Função:**
   - Selecionar "Gerente Cire" no dropdown "Função"
   - Clicar em "🔍 Buscar"
   - Apenas comissões desta função devem aparecer

6. **Verificar Tabela:**
   - Coluna "Função" deve aparecer para cada comercial
   - Exemplo: "Gerente Cire" (formatado, não "GERENTE_CIRE")

---

### Teste 4: Verificar Pagamentos

1. **Acessar Pagamentos:**
   ```
   http://localhost:3000/gestor-pf/producao/pagamentos
   ```

2. **Verificar comissões:**
   - Status: "CALCULADA" (amarelo)
   - Valor da comissão calculado

3. **Testar Pagamento (Opcional):**
   - Selecionar comissão
   - Clicar em "💰 Pagar"
   - Status muda para "PAGA" (verde)

---

## Solução de Problemas

### Problema: Coluna "Comercial" não aparece em Procedimentos

**Causa:** Cache do navegador ou servidor

**Solução:**
```bash
# 1. Parar servidor
Ctrl+C

# 2. Remover pasta .next
rm -rf .next

# 3. Reiniciar servidor
pnpm dev

# 4. Limpar cache do navegador (Ctrl+Shift+Del)
# 5. Hard reload (Ctrl+F5)
```

### Problema: Filtro "Função" não aparece em Relatórios

**Causa:** API de comerciais não está retornando campo `funcao`

**Verificação:**
```javascript
// No Console do Navegador (F12) → Network
GET /api/v1/gestor-pf/comerciais

// Deve retornar:
[
  {
    "id": "...",
    "nome": "...",
    "funcao": "GERENTE_CIRE",  // ← Deve estar presente
    ...
  }
]
```

**Solução:** Verificar se arquivo foi modificado:
- `apps/web/app/api/v1/gestor-pf/comerciais/route.ts` (linha 33)

### Problema: Comissões não são calculadas

**Causas possíveis:**

1. **Planilha sem "CPF do Comercial"**
   - Verificar se coluna existe na planilha
   - Verificar se está preenchida

2. **CPF do Comercial não cadastrado**
   - Verificar se comercial existe em `/gestor-pf/comerciais`
   - CPF deve estar exatamente igual (sem pontos/traços)

3. **Comercial de outro gestor**
   - Comercial deve ter mesmo `gestorPfId` do usuário logado

**Solução:** Reprocessar comissões
- Em `/gestor-pf/producao/relatorios`
- Clicar em "📋 Verificar procedimentos sem comercial"
- Selecionar comercial e clicar em "🔗 Vincular ao Comercial"

---

## Estrutura de Dados

### Modelo Comercial
```prisma
model Comercial {
  id                 String
  usuarioId          String
  nome               String
  cpf                String
  gestorPfId         String
  percentualComissao Decimal
  funcao             FuncaoComercial?  ← ENUM: GERENTE_CIRE, SUPERVISOR_ATIVO, etc.
  status             StatusUsuario
  ...
}
```

### Modelo ComissaoComercial
```prisma
model ComissaoComercial {
  id            String
  comercialId   String      ← FK para Comercial
  mesReferencia String
  valorVendas   Decimal
  valorComissao Decimal
  status        StatusComissao
  comercial     Comercial   ← Relação
  ...
}
```

### Modelo ProcedimentoPF
```prisma
model ProcedimentoPF {
  id               String
  comercialId      String?   ← FK opcional para Comercial
  parceiroId       String
  indicadoId       String?
  totalPago        Decimal
  valorComissao    Decimal
  comercial        Comercial? ← Relação
  ...
}
```

---

## Funções de Comercial Disponíveis

Enum `FuncaoComercial`:
- `GERENTE_CIRE` → "Gerente Cire"
- `SUPERVISOR_ATIVO` → "Supervisor Ativo"
- `SUPERVISOR_RECEPTIVO` → "Supervisor Receptivo"
- `SUPERVISOR FRANQUIA` → "Supervisor Franquia"
- `SUPERVISOR_ATENDIMENTO` → "Supervisor Atendimento"
- `GERENTE_ATENDIMENTO` → "Gerente Atendimento"
- `SUPERVISOR_COMERCIAL` → "Supervisor Comercial"

**Formatação automática:**
- `GERENTE_CIRE` → "Gerente Cire"
- Sistema converte automaticamente na exibição

---

## Regras de Comissão por Função

As regras de cálculo de comissão são definidas em:
- `apps/web/lib/pontos-utils.ts` → `calcularComissaoComercial()`

Cada função pode ter:
- Percentual diferente
- Valor fixo
- Regras específicas

**Exemplo de configuração:**
```typescript
// Regras por função
const regras = {
  GERENTE_CIRE: { percentual: 0.10 },      // 10%
  SUPERVISOR_ATIVO: { percentual: 0.05 },  // 5%
  // ...
};
```

---

## Checklist Final

### Upload
- [ ] Planilha tem coluna "CPF do Comercial"
- [ ] CPF está preenchido corretamente
- [ ] Comercial está cadastrado no sistema
- [ ] Upload foi concluído com sucesso

### Procedimentos
- [ ] Coluna "Comercial" está visível
- [ ] Nome do comercial aparece
- [ ] Função do comercial aparece formatada

### Relatórios
- [ ] Filtro "Função" está disponível
- [ ] Resumo por função aparece (cards)
- [ ] Medalhas 🥇🥈🥉 aparecem no top 3
- [ ] Filtro por função funciona
- [ ] Tabela mostra coluna "Função"

### Pagamentos
- [ ] Comissões CALCULADA aparecem
- [ ] Seleção e pagamento funcionam
- [ ] Status muda para PAGA após pagamento

---

## Logs de Debug

### Verificar no Console do Servidor

```bash
# Upload
[upload-pf] Processando arquivo...
[upload-pf] Linhas com comercial: X
[upload-pf] Linhas sem comercial: Y

# Comissões
[calcularComissaoComercial] Comercial: X
[calcularComissaoComercial] Valor vendas: R$ Y
[calcularComissaoComercial] Comissão calculada: R$ Z
```

### Verificar no Console do Navegador

```javascript
// Network tab → Verificar respostas das APIs:
GET /api/v1/gestor-pf/comerciais
GET /api/v1/gestor-pf/producao
GET /api/v1/gestor-pf/relatorio-comissoes

// Devem retornar dados completos com campo "funcao"
```

---

## Contato/Suporte

Se após seguir este guia os problemas persistirem:

1. Verificar logs completos do servidor
2. Inspecionar respostas das APIs no Network tab
3. Validar dados no banco de dados (Prisma Studio)
4. Verificar se migrations foram aplicadas corretamente