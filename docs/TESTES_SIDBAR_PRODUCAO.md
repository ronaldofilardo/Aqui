# Testes - Correção do Sidebar Produção

## Pré-requisitos
- Usuário logado: `gestor-pf@asa.com` (Gestor PF)
- Planilha já importada: `Receita Bruta Análitica01.xlsx` (3 procedimentos VALIDO)
- Parceiro "Parceiro teste" cadastrado com indicado "Nilca Aparecida" (CPF: 479.248.280-10)

---

## Teste 1: Verificar Procedimentos Importados

### Passo 1: Acessar Página de Procedimentos
1. No menu lateral, clique em **Produção** → **Procedimentos**
2. URL: `http://localhost:3000/gestor-pf/producao/procedimentos`

### Passo 2: Verificar Carregamento dos Dados
**Resultado Esperado:**
- ✅ Tabela exibe 3 procedimentos importados
- ✅ Coluna "Parceiro" mostra "Parceiro teste" em azul
- ✅ Coluna "Mês Ref." mostra "julho de 2026"
- ✅ Coluna "Status" mostra "Pendente" (amarelo)
- ✅ Total Receita: **R$ 807,00**
- ✅ Total Comissões: **R$ 0,00** (valor_comissao default = 0)

**Dados Esperados na Tabela:**

| Data | Paciente | CPF | Procedimento | Unidade | Total Pago |
|------|----------|-----|--------------|---------|------------|
| 26/06/2026 | Nilce Aparecida | 479.248.280-10 | hemograma | Acesso Saúde Colombo | R$ 222,00 |
| 26/06/2026 | Aparecida Da Silva Carvalho | 479.248.280-10 | teste de esforço | Acesso Saúde Colombo | R$ 18,00 |
| 26/06/2026 | Nilce Aparecida Carvalho | 479.248.280-10 | consulta | Acesso Saúde Colombo | R$ 567,00 |

### Passo 3: Testar Filtros
1. **Filtrar por Mês:**
   - Selecionar "julho de 2026" no dropdown "Todos os Meses"
   - ✅ Apenas os 3 procedimentos de julho aparecem

2. **Filtrar por Parceiro:**
   - Selecionar "Parceiro teste" no dropdown "Todos os Parceiros"
   - ✅ Apenas os 3 procedimentos do Parceiro teste aparecem

3. **Filtrar por Busca:**
   - Digitar "hemograma" no campo de busca
   - ✅ Apenas 1 procedimento aparece (hemograma)
   
4. **Filtrar por Status:**
   - Selecionar "PENDENTE" no dropdown "Todos Status"
   - ✅ Os 3 procedimentos aparecem (todos estão PENDENTE)

**Critério de Aprovação:**
- [ ] 3 procedimentos aparecem na tabela
- [ ] Dados do paciente, procedimento e valores estão corretos
- [ ] Filtros funcionam corretamente
- [ ] Totais de Receita e Comissões são calculados corretamente

---

## Teste 2: Verificar Relatório de Comissões

### Passo 1: Acessar Página de Relatórios
1. No menu lateral, clique em **Produção** → **Relatórios**
2. URL: `http://localhost:3000/gestor-pf/producao/relatorios`

### Passo 2: Selecionar Período
1. **Período Inicial:** `2026-07`
2. **Período Final:** `2026-07`
3. Clique em **"🔍 Buscar"**

### Passo 3: Verificar Resultados
**Resultado Esperado:**
- ✅ Tabela exibe comissões dos comerciais (se houver comercial vinculado na importação)
- ✅ Resumo mostra:
  - Total Vendas: R$ 807,00
  - Total Comissões: (valor calculado conforme regra de comissão)
  - Quantidade: (número de comissões)

**Se não houver comercial na planilha:**
- ✅ Mensagem: "Nenhum registro encontrado no período selecionado."
- ✅ Isso é esperado, pois a planilha não tinha "CPF do Comercial"

### Passo 4: Testar Exportação CSV
1. Clique em **"📥 Exportar"**
2. ✅ Arquivo CSV é baixado com nome `relatorio-comissoes-2026-07-a-2026-07.csv`

**Critério de Aprovação:**
- [ ] Página carrega sem erros
- [ ] Filtro por período funciona
- [ ] Resumo calcula totais corretamente
- [ ] Exportação CSV funciona

---

## Teste 3: Verificar Gestão de Pagamentos

### Passo 1: Acessar Página de Pagamentos
1. No menu lateral, clique em **Produção** → **Pagamentos**
2. URL: `http://localhost:3000/gestor-pf/producao/pagamentos`

### Passo 2: Verificar Resumo
**Resultado Esperado:**
- ✅ Card "A Pagar":
  - Valor: R$ 0,00 (ou valor das comissões calculadas)
  - Quantidade: (número de comissões CALCULADA)
  
- ✅ Card "Selecionado":
  - Valor: R$ 0,00 (inicialmente)
  - Quantidade: 0 comissões

- ✅ Card "Já Pagas":
  - Valor: R$ 0,00 (inicialmente)
  - Quantidade: 0 comissões

### Passo 3: Verificar Tabela de Comissões
**Filtro Padrão:** Status = "A Pagar" (CALCULADA)

**Resultado Esperado:**
- ✅ Se houver comissões CALCULADA:
  - Tabela exibe comissões com checkbox para seleção
  - Colunas: Mês, Comercial, Função, Vendas, Comissão, Status, Pagamento
  
- ✅ Se não houver comissões:
  - Mensagem: "Nenhuma comissão encontrada"

### Passo 4: Testar Filtros
1. **Filtrar por Status:**
   - Selecionar "Todos" no dropdown
   - ✅ Mostra todas as comissões (CALCULADA e PAGA)
   
   - Selecionar "Pagas"
   - ✅ Mostra apenas comissões com status PAGA

2. **Filtrar por Mês:**
   - Selecionar `2026-07`
   - ✅ Mostra apenas comissões de julho/2026

### Passo 5: Testar Seleção em Massa
1. Marcar checkbox "Selecionar Todos" (cabeçalho da tabela)
2. ✅ Todas as comissões CALCULADA são marcadas
3. Card "Selecionado" atualiza com total

### Passo 6: Testar Exportar Recibo
1. Selecionar pelo menos 1 comissão
2. Clicar em **"📄 Exportar Recibo"**
3. ✅ Arquivo de texto é baixado com:
   - Lista de comissões selecionadas
   - Valores de vendas e comissões
   - Total geral

### Passo 7: Testar Pagamento (Opcional - Destrutivo)
⚠️ **Atenção:** Este teste altera o status das comissões para PAGA

1. Selecionar 1 ou mais comissões
2. Clicar em **"💰 Pagar X Selecionada(s)"**
3. Confirmar no dialog: "Confirmar pagamento de X comissões?"
4. ✅ Toast exibe: "✅ X comissões pagas com sucesso - Total: R$ Y,YY"
5. ✅ Tabela atualiza:
   - Status muda para "PAGA" (verde)
   - Checkbox fica desabilitado (✓ cinza)
   - Coluna "Pagamento" mostra data atual
6. ✅ Cards de resumo atualizam:
   - "A Pagar" diminui
   - "Já Pagas" aumenta

**Critério de Aprovação:**
- [ ] Página carrega sem erros
- [ ] Resumo mostra valores corretos
- [ ] Filtros funcionam corretamente
- [ ] Seleção em massa funciona
- [ ] Exportar recibo funciona
- [ ] Pagamento altera status corretamente (se testado)

---

## Teste 4: Verificar API Diretamente (Debug)

### Passo 1: Testar API de Produção
```bash
curl -X GET "http://localhost:3000/api/v1/gestor-pf/producao?page=1&limit=50" \
  --header "Cookie: next-auth.session-token=SEU_TOKEN"
```

**Resultado Esperado:**
```json
{
  "procedimentos": [
    {
      "id": "...",
      "paciente": "Nilce Aparecida",
      "procedimento": "hemograma",
      "parceiro": {
        "id": "...",
        "nome": "Parceiro teste",
        "cpf": "..."
      },
      "indicado": {
        "id": "...",
        "nome": "Nilca Aparecida",
        "cpf": "47924828010"
      },
      "upload": {
        "id": "...",
        "nomeArquivo": "Receita Bruta Análitica01.xlsx",
        "mesReferencia": "2026-07"
      },
      "totalPago": "222.00",
      "statusComissao": "PENDENTE"
    }
    // ... mais 2 procedimentos
  ],
  "parceiros": [
    {
      "id": "...",
      "nome": "Parceiro teste",
      "cpf": "..."
    }
  ],
  "mesesDisponiveis": ["2026-07"],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "totalPages": 1
  }
}
```

**Critério de Aprovação:**
- [ ] API retorna HTTP 200
- [ ] `procedimentos` array tem 3 itens
- [ ] Cada procedimento tem `parceiro`, `indicado`, `upload` populados
- [ ] `parceiros` array tem pelo menos 1 item (Parceiro teste)
- [ ] `mesesDisponiveis` inclui "2026-07"
- [ ] `pagination.total` = 3

### Passo 2: Testar API de Comissões/Lista
```bash
curl -X GET "http://localhost:3000/api/v1/gestor-pf/comissoes/lista?status=TODOS" \
  --header "Cookie: next-auth.session-token=SEU_TOKEN"
```

**Resultado Esperado:**
```json
[
  {
    "id": "...",
    "mesReferencia": "2026-07",
    "comercial": {
      "id": "...",
      "nome": "Nome do Comercial",
      "email": "email@exemplo.com",
      "funcao": "..."
    },
    "valorVendas": "807.00",
    "valorComissao": "...",
    "status": "CALCULADA"
  }
]
```

**Critério de Aprovação:**
- [ ] API retorna HTTP 200
- [ ] Retorna comissões calculadas (se houver comercial na importação)

---

## Checklist Final de Validação

### Funcionalidades Principais
- [ ] **Procedimentos**: Dados importados aparecem na tabela
- [ ] **Relatórios**: Comissões são agrupadas por mês e comercial
- [ ] **Pagamentos**: Comissões podem ser selecionadas e pagas

### Filtros
- [ ] Filtro por status (PENDENTE, CALCULADA, PAGA)
- [ ] Filtro por mês de referência
- [ ] Filtro por parceiro
- [ ] Busca textual (paciente, procedimento, CPF, unidade)

### Dados Vinculados
- [ ] `parceiro` aparece corretamente (não mostra "Sem vínculo")
- [ ] `indicado` aparece corretamente
- [ ] `upload` mostra nome do arquivo e mês de referência
- [ ] Totais de Receita e Comissões são calculados

### Performance
- [ ] Página carrega em menos de 2 segundos
- [ ] Filtros respondem rapidamente
- [ ] Paginação funciona (se houver mais de 50 procedimentos)

---

## Troubleshooting

### Problema: "Nenhum procedimento encontrado"
**Causas possíveis:**
1. Filtro de parceiro está selecionado, mas procedimentos são de outro parceiro
   - **Solução:** Limpar filtro "Todos os Parceiros"
   
2. Filtro de mês está incorreto
   - **Solução:** Verificar se mês "2026-07" está disponível

3. API não está filtrando corretamente por gestorPfId
   - **Solução:** Verificar logs do servidor no console

4. Dados não foram importados corretamente
   - **Solução:** Verificar em `/gestor-pf/uploads` se status = "CONCLUIDO"

### Problema: "Parceiro: Sem vínculo"
**Causa:** Procedimento foi criado sem `parceiroId`
- **Solução:** Verificar se CPF do indicado estava cadastrado antes da importação

### Problema: Comissões não aparecem
**Causas possíveis:**
1. Planilha não tinha "CPF do Comercial"
   - **Solução:** Isso é esperado. Comissões só são criadas se houver comercial vinculado.

2. Comercial não está vinculado ao gestorPfId correto
   - **Solução:** Verificar cadastro do comercial em `/gestor-pf/comerciais`

---

## Evidências de Teste (Preencher)

| Teste | Data/Hora | Executor | Status | Observações |
|-------|-----------|----------|--------|-------------|
| Teste 1: Procedimentos | | | ⬜ Pendente ⬜ Aprovado ⬜ Reprovado | |
| Teste 2: Relatórios | | | ⬜ Pendente ⬜ Aprovado ⬜ Reprovado | |
| Teste 3: Pagamentos | | | ⬜ Pendente ⬜ Aprovado ⬜ Reprovado | |
| Teste 4: API | | | ⬜ Pendente ⬜ Aprovado ⬜ Reprovado | |

**Status Final:** ⬜ Aprovado ⬜ Reprovado

**Assinatura:** _________________________