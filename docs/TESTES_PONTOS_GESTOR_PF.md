# Testes do Sistema de Pontos - Gestor PF

## Visão Geral

Esta suíte de testes cobre todas as funcionalidades implementadas para o sistema de pontos do Gestor PF, incluindo:

- Configuração de pontos
- Distribuição de pontos por produção
- Cálculo de pontos com diferentes regras de arredondamento
- Ranking de parceiros
- Validações de ciclo

## Arquivos de Teste

### 1. `pontos-gestor-pf.test.ts`

Testes de integração do sistema completo de pontos:

#### Configuração de Pontos
- ✅ Criar configuração de pontos corretamente
- ✅ Atualizar configuração de pontos
- ✅ Encerrar configuração anterior ao criar nova

#### Distribuição de Pontos
- ✅ Distribuir pontos para procedimento com parceiro
- ✅ Não distribuir pontos para procedimento já processado (duplicidade)
- ✅ Calcular pontos corretamente com diferentes valores
- ✅ Aplicar arredondamento PISO corretamente
- ✅ Aplicar arredondamento TETO corretamente

#### Ranking de Pontos
- ✅ Calcular saldo de pontos corretamente (créditos - débitos)
- ✅ Ordenar ranking por pontos acumulados

#### Validações do Ciclo
- ✅ Validar se procedimento está dentro do período do ciclo
- ✅ Não permitir criar ciclo com mesma periodicidade ativo
- ✅ Permitir criar ciclo com periodicidade diferente (SEMESTRAL + ANUAL)

### 2. `pontos-distribuicao.test.ts`

Testes específicos para o endpoint de distribuição:

#### calcularPontosDeProducao
- ✅ Calcular pontos com arredondamento padrão
- ✅ Calcular pontos com arredondamento PISO
- ✅ Calcular pontos com arredondamento TETO
- ✅ Retornar 0 pontos para valor abaixo do mínimo

#### obterCicloVigente
- ✅ Retornar ciclo EM_ANDAMENTO
- ✅ Retornar ciclo RESGATE_ABERTO se não houver EM_ANDAMENTO
- ✅ Retornar null se não houver ciclo vigente
- ✅ Filtrar por periodicidade quando especificado

#### Movimentação de Pontos
- ✅ Criar movimentação de crédito por produção
- ✅ Não permitir duplicidade de pontos para mesma produção
- ✅ Permitir múltiplas produções para o mesmo parceiro

## Como Executar os Testes

```bash
# Executar todos os testes de pontos
pnpm test -- pontos-gestor-pf
pnpm test -- pontos-distribuicao

# Executar com watch mode
pnpm test -- pontos-gestor-pf --watch
pnpm test -- pontos-distribuicao --watch

# Executar com coverage
pnpm test -- pontos-gestor-pf --coverage
```

## Estrutura dos Dados de Teste

### Configuração Padrão
- **Valor por ponto**: R$ 100,00
- **Arredondamento**: PADRÃO (math.round)
- **Período do ciclo**: 01/01/2026 a 30/06/2026

### Exemplos de Cálculo
| Valor Pago | Pontos (PADRÃO) | Pontos (PISO) | Pontos (TETO) |
|------------|-----------------|---------------|---------------|
| R$ 50,00   | 0               | 0             | 1             |
| R$ 100,00  | 1               | 1             | 1             |
| R$ 150,00  | 2               | 1             | 2             |
| R$ 250,00  | 3               | 2             | 3             |
| R$ 1000,00 | 10              | 10            | 10            |

## Funcionalidades Implementadas

### 1. Endpoint GET `/api/v1/gestor-pf/pontos/distribuir`

Retorna lista de todas as produções com:
- Dados do procedimento (paciente, procedimento, valor, data)
- Dados do parceiro
- Pontos já distribuídos (se houver)
- Pontos potenciais a distribuir
- Ciclo vigente

### 2. Endpoint POST `/api/v1/gestor-pf/pontos/distribuir`

Distribui pontos para uma produção específica:
- Valida se produção existe e tem parceiro
- Valida se produção está dentro do período do ciclo
- Valida se pontos ainda não foram distribuídos
- Calcula pontos baseado na configuração vigente
- Cria movimentação de crédito

### 3. Interface "Distribuir Pontos"

Componente visual que:
- Lista todas as produções com parceiros
- Exibe pontos potenciais para cada produção
- Mostra badge verde para já distribuídos
- Mostra badge amarelo para não distribuídos
- Permite distribuir pontos com um clique
- Exibe ciclo vigente no topo

## Validações Implementadas

### No Backend
- ✅ Gestor PF autenticado e autorizado
- ✅ Produção existe e tem parceiro vinculado
- ✅ Produção pertence ao gestor
- ✅ Pontos ainda não foram distribuídos
- ✅ Ciclo vigente existe
- ✅ Produção está dentro do período de acumulo do ciclo
- ✅ Total pago é maior que zero
- ✅ Pontos calculados são positivos

### No Frontend
- ✅ Validação visual de produções já distribuídas
- ✅ Exibição clara de pontos potenciais
- ✅ Feedback de sucesso/erro ao distribuir
- ✅ Recarregamento automático após distribuição
- ✅ Exibição do ciclo vigente

## Regras de Negócio

### Cálculo de Pontos
```
pontos = totalPago / valorPorPonto
```

Aplicando arredondamento:
- **PADRÃO**: `Math.round(pontos)`
- **PISO**: `Math.floor(pontos)`
- **TETO**: `Math.ceil(pontos)`

### Saldo de Pontos
```
saldo = creditos - debitos + estornos
```

### Período do Ciclo
- Produção deve estar entre `inicioAcumuloEm` e `fimAcumuloEm`
- Produções fora do período não geram pontos

### Periodicidade de Ciclos
- Ciclos SEMESTRAL e ANUAL podem coexistir
- Não pode haver dois ciclos ativos da mesma periodicidade

## Casos de Teste Especiais

### 1. Produção com Valor Zero
- Deve retornar erro "Total pago deve ser maior que zero"

### 2. Produção Fora do Período
- Deve retornar erro informando que produção não está no período do ciclo

### 3. Configuração Não Encontrada
- Deve retornar erro "Configuração de pontos não encontrada"

### 4. Ciclo Não Encontrado
- Deve retornar erro "Nenhum ciclo vigente encontrado"

### 5. Duplicidade de Distribuição
- Deve retornar erro "Pontos já foram distribuídos para esta produção"

## Melhorias Futuras (Sugestões)

- [ ] Distribuição em lote (todos de uma vez)
- [ ] Histórico de pontos distribuídos
- [ ] Estorno de pontos
- [ ] Exportar relatório de pontos
- [ ] Notificação automática ao distribuir pontos
- [ ] Validação de CPF do paciente vs CPF do parceiro
- [ ] Cálculo automático na importação da planilha

## Manutenção

Ao modificar as regras de cálculo de pontos, atualize:
1. Os testes em `pontos-distribuicao.test.ts`
2. A tabela de exemplos acima
3. A documentação das regras de negócio

## Contato

Para dúvidas sobre os testes, consultar:
- Arquivo: `apps/web/app/__tests__/pontos-gestor-pf.test.ts`
- Arquivo: `apps/web/app/__tests__/pontos-distribuicao.test.ts`
- Endpoint: `apps/web/app/api/v1/gestor-pf/pontos/distribuir/route.ts`