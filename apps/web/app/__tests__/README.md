# Testes - Backoffice API

Este diretório contém todos os testes unitários e de integração da API Backoffice.

## 📋 Tipos de Testes

### 1. Testes Unitários da API (`api-backoffice.test.ts`)
Testes isolados de cada endpoint, validando:
- Configurações do backoffice
- Listagem de lideranças, comerciais e parceiros
- Sistema de pontos (ciclos, configurações, prêmios)
- Regras de comissionamento
- Relatórios

**Como rodar:**
```bash
pnpm test api-backoffice
```

### 2. Testes de Integração (`api-backoffice-integration.test.ts`)
Testes de fluxos completos, validando:
- Ciclo de vida completo de comerciais (CRUD)
- Sistema de pontos (criar ciclo → configurar → premiar → resgatar)
- Comissões e regras
- Upload e processamento de planilhas

**Como rodar:**
```bash
pnpm test api-backoffice-integration
```

### 3. Testes de Rate Limiting (`rate-limit.test.ts`)
Testes do sistema de proteção contra abuso:
- Limites por IP/usuário
- Janelas de tempo
- Reset automático
- Opções específicas por rota

**Como rodar:**
```bash
pnpm test rate-limit
```

## 🧪 Rodando Todos os Testes

```bash
# Todos os testes
pnpm test

# Testes com watch mode (desenvolvimento)
pnpm test:watch

# Testes com coverage
pnpm test:coverage
```

## 📊 Cobertura de Testes

| Categoria | Arquivo | Status | Cobertura |
|-----------|---------|--------|-----------|
| API Unitários | `api-backoffice.test.ts` | ✅ | 15 testes |
| API Integração | `api-backoffice-integration.test.ts` | ✅ | 4 fluxos completos |
| Rate Limiting | `rate-limit.test.ts` | ✅ | 12 testes |
| **Total** | - | ✅ | **31 testes** |

## 🔧 Configuração

Os testes usam:
- **Vitest** como runner
- **Prisma Client** para banco de dados
- **bcryptjs** para hash de senhas
- Ambiente: Node.js

### Variáveis de Ambiente

Certifique-se de ter o `.env` configurado:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/asa_db_test"
```

## 📝 Padrões de Teste

### Setup e Cleanup

Todos os testes seguem o padrão:

```typescript
describe('Feature', () => {
  let resourceId: string;

  beforeEach(async () => {
    // Criar dados de teste
    resource = await prisma.model.create({ ... });
  });

  afterEach(async () => {
    // Cleanup em cascata
    await prisma.model.deleteMany({ ... });
  });

  it('deve fazer algo', async () => {
    // Teste
  });
});
```

### Testes de Integração

Fluxos completos devem:
1. Criar todos os dados necessários
2. Executar o fluxo completo
3. Validar cada passo
4. Fazer cleanup completo

Exemplo:
```typescript
it('deve criar ciclo, configuração, prêmio e resgate', async () => {
  // 1. Criar configuração
  const config = await prisma.configuracaoPontos.create({ ... });
  
  // 2. Criar ciclo
  const ciclo = await prisma.cicloPontos.create({ ... });
  
  // 3. Criar prêmio
  const premio = await prisma.premio.create({ ... });
  
  // 4. Validar
  expect(premio.custoPontos).toBe(5000);
  
  // 5. Cleanup
  await prisma.premio.delete({ where: { id: premio.id } });
  // ...
});
```

## 🐛 Debug de Testes

### Verbose Mode
```bash
pnpm test --reporter=verbose
```

### Teste Específico
```bash
pnpm test -- -t "deve criar comercial"
```

### Inspect Mode
```bash
pnpm test --inspect-brk
```

## 📈 Adicionando Novos Testes

1. Crie o arquivo `*.test.ts` no diretório `__tests__/`
2. Siga a estrutura existente
3. Use `beforeEach` e `afterEach` para setup/cleanup
4. Valide com `expect()`
5. Rode localmente antes de commitar

### Exemplo de Novo Teste

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';

describe('Nova Feature', () => {
  beforeEach(async () => {
    // Setup
  });

  afterEach(async () => {
    // Cleanup
  });

  it('deve fazer algo', async () => {
    const result = await prisma.model.create({ ... });
    expect(result).toBeDefined();
  });
});
```

## ✅ Critérios de Aceite

Para um teste ser considerado válido:
- [ ] Deve ser independente (não depender de outros testes)
- [ ] Deve fazer cleanup completo
- [ ] Deve validar o comportamento esperado
- [ ] Deve ter nome descritivo
- [ ] Deve rodar em < 5 segundos

## 🚨 Problemas Comuns

### "Teste falha intermitentemente"
- Verifique se há dependência de timing
- Use `async/await` corretamente
- Isole dados de teste

### "Cleanup falha"
- Verifique ordem de deleção (cascata)
- Use `deleteMany` quando apropriado
- Capture erros no cleanup

### "Banco de dados não existe"
- Crie banco de teste: `CREATE DATABASE asa_db_test`
- Rode migrations: `pnpm prisma migrate deploy`

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing/unit-testing)
- [Testing Library](https://testing-library.com/)

---

**Manutenção:** Atualize este README ao adicionar novos tipos de teste.