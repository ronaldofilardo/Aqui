# Sistema de Pontos - Guia de Implementação

## 📋 Resumo Técnico

### Schema Prisma

✅ Adicionados 8 novos modelos:

- `BaseClientesAcessoSaude` - Validação de base de clientes
- `ConfiguracaoPontos` - Gestão de valor por ponto e arredondamento
- `CicloPontos` - Gestão de ciclos (EM_ANDAMENTO → RESGATE_ABERTO → ENCERRADO)
- `MovimentacaoPontos` - Ledger de movimentações (CREDITO/DEBITO/ESTORNO)
- `RankingSnapshot` - Snapshots de ranking por mês
- `RankingPosicao` - Posições individuais no ranking
- `Premio` - Catálogo de prêmios
- `SolicitacaoResgate` - Rastreamento de solicitações de resgate

✅ Adicionados 5 enums novos:

- `TipoMovimentacaoPontos`
- `OrigemMovimentacaoPontos`
- `StatusCicloPontos`
- `TipoArredondamento`
- `StatusSolicitacaoResgate`

---

## 🚀 API Endpoints

### Gestor-PF

#### Configuração de Pontos

- **GET** `/api/v1/gestor-pf/pontos/configuracao` - Listar configurações
- **POST** `/api/v1/gestor-pf/pontos/configuracao` - Criar nova configuração
- **PATCH** `/api/v1/gestor-pf/pontos/configuracao?id={id}` - Atualizar configuração

#### Ciclos

- **GET** `/api/v1/gestor-pf/pontos/ciclos` - Listar ciclos
- **POST** `/api/v1/gestor-pf/pontos/ciclos` - Criar ciclo
- **PATCH** `/api/v1/gestor-pf/pontos/ciclos/{id}` - Transicionar status

#### Prêmios

- **GET** `/api/v1/gestor-pf/pontos/premios` - Listar prêmios
- **POST** `/api/v1/gestor-pf/pontos/premios` - Criar prêmio
- **PATCH** `/api/v1/gestor-pf/pontos/premios?id={id}` - Atualizar prêmio
- **DELETE** `/api/v1/gestor-pf/pontos/premios?id={id}` - Deletar prêmio

#### Resgates

- **GET** `/api/v1/gestor-pf/pontos/resgates?status={status}` - Listar resgates
- **PATCH** `/api/v1/gestor-pf/pontos/resgates/{id}` - Aprovar/Rejeitar/Entregar

#### Ranking

- **GET** `/api/v1/gestor-pf/pontos/ranking?cicloPontosId={id}` - Visualizar ranking

### Parceiro

#### Carteira

- **GET** `/api/v1/parceiro/pontos/carteira` - Saldo atual

#### Extrato

- **GET** `/api/v1/parceiro/pontos/extrato?limit=50&offset=0` - Movimentações

#### Ranking

- **GET** `/api/v1/parceiro/pontos/ranking` - Visualizar ranking

#### Prêmios

- **GET** `/api/v1/parceiro/pontos/premios` - Catálogo disponível

#### Resgates

- **GET** `/api/v1/parceiro/pontos/resgates` - Minhas solicitações
- **POST** `/api/v1/parceiro/pontos/resgates` - Solicitar resgate
- **PATCH** `/api/v1/parceiro/pontos/resgates/{id}` - Cancelar solicitação

---

## 🎨 Componentes React

### Parceiro

- `MinhaCarteira` - Visualizar saldo e período do ciclo
- `ExtratoMovimentacoes` - Histórico de movimentações
- `MeuRanking` - Visualizar minha posição no ranking
- `CatalogoPremios` - Catálogo de prêmios disponíveis
- `MinhasSolicitacoesResgate` - Gerenciar minhas solicitações

### Gestor-PF

- `GerenciadorCiclosPontos` - Criar e transicionar ciclos
- `GerenciadorPremios` - CRUD de prêmios
- `FilaResgates` - Aprovar/rejeitar/entregar resgates
- `RankingGestor` - Visualizar ranking dos parceiros

---

## 🔧 Como fazer a Migration

### 1. Gerar Migration

```bash
cd packages/database
npx prisma migrate dev --name add_pontos_system
```

### 2. Seed (Opcional)

Para popular dados de teste, crie um arquivo `seed-pontos.ts` em `packages/database/prisma/`:

```typescript
import { prisma } from "../src/index";

async function main() {
  // Criar base de clientes
  await prisma.baseClientesAcessoSaude.create({
    data: { cpf: "12345678901" },
  });

  console.log("Seed de pontos concluído!");
}

main().catch(console.error);
```

Execute:

```bash
npx prisma db seed
```

---

## 📊 Fluxo de Negócio

### 1. Setup Inicial (Gestor-PF)

1. Criar Configuração de Pontos (valor/ponto e arredondamento)
2. Criar Ciclo (datas de acúmulo e resgate)
3. Criar Catálogo de Prêmios

### 2. Acúmulo de Pontos (Automático)

- Quando produção é importada, sistema calcula pontos automaticamente
- Pontos são creditados no MovimentacaoPontos com origem PRODUCAO_IMPORTADA

### 3. Período de Resgate (Gestor-PF transiciona ciclo)

1. Ciclo muda: EM_ANDAMENTO → RESGATE_ABERTO
2. Parceiros podem solicitar resgates
3. Gestor aprova/rejeita

### 4. Encerramento (Gestor-PF transiciona ciclo)

1. Ciclo muda: RESGATE_ABERTO → ENCERRADO
2. Sistema expira pontos remanescentes
3. Novo ciclo pode ser criado

---

## 🔐 Segurança

- ✅ Autenticação por tipo de usuário (requireGestorPFWithScope, requireParceiroWithScope)
- ✅ Validação de scopo (gestor só vê seus dados)
- ✅ Transactions para debito/estorno de pontos
- ✅ Auditoria via MovimentacaoPontos ledger

---

## 📝 Utilitários

**`apps/web/lib/pontos-utils.ts`** contém:

- `calcularPontosDeProducao()` - Calcula pontos com arredondamento
- `obterCicloVigente()` - Busca ciclo ativo
- `calcularSaldoPontos()` - Calcula saldo do parceiro
- `validarCPF()` - Valida CPF
- `normalizarCPF()` - Remove máscara

---

## 🧪 Testes Recomendados

1. **Criar ciclo** e validar transições de estado
2. **Importar produção** e verificar cálculo de pontos
3. **Solicitar resgate** e validar dedução de saldo
4. **Cancelar resgate** e validar estorno
5. **Expirar pontos** ao encerrar ciclo

---

## ⚠️ Notas Importantes

- **Pontos expiram** ao encerrar o ciclo
- **Resgates não afetam ranking** (mas debitam o saldo)
- **Snapshots de ranking** são criados manualmente por mês
- **CPF único** em Indicado, validar contra BaseClientesAcessoSaude

---

## 📦 Dependências

- **Prisma**: ORM para banco de dados
- **Zod**: Validação de schemas
- **React**: Componentes frontend

Todas já estão incluídas no projeto.
