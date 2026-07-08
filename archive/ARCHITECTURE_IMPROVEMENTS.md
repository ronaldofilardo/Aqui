# Melhorias Arquiteturais — 28/04/2026

## 🔴 Problemas Críticos Resolvidos

### 1. Falta de Relação Gestor↔Consultor

**Problema**: Banco não modelava quais consultores um gestor gerencia. A hierarquia não existia estruturalmente.

**Solução**:

- ✅ Adicionado modelo `GestorConsultor` no schema Prisma
- ✅ Criada migration `20260428130000_add_gestor_consultor_relation`
- ✅ Índices: `(gestorId, consultorId)` UNIQUE + índices separados para queries

```prisma
model GestorConsultor {
  id           String
  gestorId     String      // FK → Usuario (tipo=GESTOR)
  consultorId  String      // FK → Consultor
  atribuidoEm  DateTime

  @@unique([gestorId, consultorId])
}
```

---

### 2. Data Leakage — Gestor Lê Comissões de TODOS os Consultores

**Problema**: Rota `GET /api/v1/gestor/comissoes` retornava comissões de **QUALQUER** consultor, sem validar escopo.

**Solução**:

- ✅ Novo middleware `requireGestorWithScope()` em `lib/api-helpers.ts`
- ✅ Retorna `consultorIds` que o gestor gerencia
- ✅ Rota atualizada com filtro: `consultorId: { in: consultorIds }`

```typescript
// Antes (VULNERÁVEL):
const comissoes = await prisma.comissao.findMany({ where: {} });

// Depois (SEGURO):
const { consultorIds } = await requireGestorWithScope();
const comissoes = await prisma.comissao.findMany({
  where: { consultorId: { in: consultorIds } },
});
```

---

### 3. Autorização Superficial (Tipo-only)

**Problema**: Helpers como `requireGestor()` verificavam apenas `tipo === "GESTOR"`, não escopo de dados.

**Solução**:

- ✅ Novo padrão: `requireGestorWithScope()` combina autenticação + autorização + escopo
- ✅ Middleware fornece IDs dos recursos que o usuário pode acessar
- ✅ Query sempre filtra por esses IDs (defense-in-depth)

---

## 📋 Mudanças Realizadas

| Arquivo                                                | Mudança                                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| `packages/database/prisma/schema.prisma`               | Adicionado modelo `GestorConsultor` com relações |
| `packages/database/prisma/migrations/20260428130000_*` | Migration SQL para criar tabela                  |
| `apps/web/lib/api-helpers.ts`                          | Novo helper `requireGestorWithScope()`           |
| `apps/web/app/api/v1/gestor/comissoes/route.ts`        | Rota GET atualizada com filtro por escopo        |

---

## 🏗️ Arquitetura Corrigida

### Hierarquia de Usuários (Modelada)

```
Usuario (tipo=GESTOR)
    ↓ GestorConsultor.atribui
    ↓ Consultor (usuario_id)
    ↓ Estabelecimento
    └─→ Comissao
```

### Fluxo de Autorização Seguro

```typescript
1. requireGestorWithScope()
   ├─ Autentica (JWT)
   ├─ Autoriza (tipo = GESTOR)
   └─ Recupera escopo (consultorIds)

2. Query com filtro de escopo
   └─ WHERE consultorId IN [... atribuídos...]
```

---

## ✅ Impacto & Próximas Passos

### Imediato

- ✅ Data leakage **ELIMINADA**
- ✅ Gestor vê apenas seus consultores
- ✅ Padrão replicável para outras rotas

### Para Implementar (Próximas Sessões)

- [ ] Aplicar mesmo padrão a todas rotas GET de gestor
- [ ] Adicionar rastreamento de auditoria (quem atribuiu qual consultor)
- [ ] Criar endpoints de gerenciamento: POST/DELETE GestorConsultor
- [ ] Testes e2e de acesso scope-based

### Segurança Residual

- ⚠️ Modelo UsuarioEstabelecimento paralelo → reconciliar com Usuario principal
- ⚠️ Valores de comissão hardcoded (10, 20) → implementar tabela de configuração

---

## 📐 Padrão Recomendado para Novas Rotas

```typescript
// Em lib/api-helpers.ts
export async function requireGestorWithScope() {
  const { session } = await requireGestor();
  const consultorIds = await getGestorConsultores(session.user.id);
  return { session, consultorIds, error: null };
}

// Em app/api/v1/gestor/*/route.ts
export async function GET(req) {
  const { error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  // SEMPRE filtrar por consultorIds
  const data = await prisma.model.findMany({
    where: { consultorId: { in: consultorIds } },
  });
}
```

---

**Revisor**: Sistema  
**Data**: 28/04/2026  
**Status**: Implementado & Pronto para Teste
