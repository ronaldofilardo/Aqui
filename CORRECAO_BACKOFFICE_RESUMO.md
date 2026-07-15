# Correção Backoffice - Resumo

## Problema
Após a refatoração da última semana, o perfil **Backoffice** (antigo GESTOR-PF) não conseguia acessar o dashboard, recebendo erro `permission_denied`.

## Causa Raiz
O middleware estava restringindo acesso às rotas `/backoffice/*` apenas para usuários com `tipo: "BACKOFFICE"`, mas o seed do banco estava criando usuários backoffice com:
- `tipo: "GESTOR"`
- `papel: "BACKOFFICE"`

## Solução Implementada

### 1. Atualização do Middleware (`apps/web/middleware.ts`)
```typescript
// ANTES
{ prefix: "/backoffice", allowedTipos: ["BACKOFFICE"], allowedPapeis: ["BACKOFFICE"] },
{ prefix: "/gestor-pf", allowedTipos: ["BACKOFFICE"], allowedPapeis: ["BACKOFFICE"] },

// DEPOIS
{ prefix: "/backoffice", allowedTipos: ["BACKOFFICE", "GESTOR"], allowedPapeis: ["BACKOFFICE"] },
{ prefix: "/gestor-pf", allowedTipos: ["BACKOFFICE", "GESTOR"], allowedPapeis: ["BACKOFFICE"] },
```

### 2. Atualização do Seed (`packages/database/sql/seed_usuarios_default.sql`)
- **Admin**: `admin@asa.com` | tipo: `ADMIN` | senha: `123456`
- **BackOffice**: `back@asa.com` | tipo: `GESTOR`, papel: `BACKOFFICE` | CPF: `12345678901` | senha: `123456`
- **Gestor PJ**: `gestor-pj@asa.com` | tipo: `GESTOR`, papel: `GESTOR_PJ` | CPF: `12345678902` | senha: `123456`
- **Consultor**: `consultor@asa.com` | tipo: `CONSULTOR` | CPF: `12345678903` | senha: `123456`

### 3. Novos Testes Criados

#### `apps/web/app/__tests__/middleware-routing.test.ts`
- Atualizado para refletir novas regras de acesso BACKOFFICE
- Adicionados testes para `/backoffice` e `/gestor-pf`
- **35 testes** passando

#### `apps/web/app/__tests__/backoffice-permissions.test.ts` (NOVO)
- Testes específicos de permissão para perfil BACKOFFICE
- Valida acesso a rotas `/backoffice/*` e `/gestor-pf/*`
- Valida restrições de acesso a outras rotas
- **29 testes** passando

#### `apps/web/app/__tests__/seed-usuarios.test.ts` (NOVO)
- Validação automática do arquivo seed
- Verifica emails, tipos, papéis e CPFs
- Valida hash de senha padrão
- **12 testes** passando

#### `apps/web/app/__tests__/login-page.test.ts`
- Já continha testes para redirecionamento BACKOFFICE
- **16 testes** passando

## Matriz de Acesso

| Perfil | Tipo | Papel | /backoffice/* | /gestor-pf/* | /gestor/* | /admin/* |
|--------|------|-------|---------------|--------------|-----------|----------|
| Admin | ADMIN | - | ❌ | ❌ | ❌ | ✅ |
| Backoffice | GESTOR | BACKOFFICE | ✅ | ✅ | ❌ | ❌ |
| Gestor PJ | GESTOR | GESTOR_PJ | ❌ | ❌ | ✅ | ❌ |
| Parceiro | PARCEIRO | - | ❌ | ❌ | ❌ | ❌ |
| Comercial | COMERCIAL | - | ❌ | ❌ | ❌ | ❌ |
| Consultor | CONSULTOR | - | ❌ | ❌ | ❌ | ❌ |

## Execução dos Testes
```bash
# Executar todos os testes relacionados
pnpm vitest run apps/web/app/__tests__/middleware-routing.test.ts
pnpm vitest run apps/web/app/__tests__/backoffice-permissions.test.ts
pnpm vitest run apps/web/app/__tests__/seed-usuarios.test.ts
pnpm vitest run apps/web/app/__tests__/login-page.test.ts

# Ou todos juntos
pnpm vitest run apps/web/app/__tests__/middleware-routing.test.ts apps/web/app/__tests__/backoffice-permissions.test.ts apps/web/app/__tests__/seed-usuarios.test.ts apps/web/app/__tests__/login-page.test.ts
```

## Resultado
✅ **92 testes passando**
- Middleware routing: 35 testes
- Backoffice permissions: 29 testes
- Seed usuários: 12 testes
- Login page: 16 testes

## Próximos Passos
1. ✅ Seed executado no banco de dados
2. ✅ Middleware atualizado
3. ✅ Testes aprovados
4. ⏭️ Fazer logout e login novamente para atualizar o token JWT
5. ⏭️ Acessar `http://localhost:3000/backoffice/dashboard`

## Comandos Úteis
```bash
# Re-executar seed no banco
$env:PGPASSWORD='123456'; psql -U postgres -d asa_db -h localhost -f packages/database/sql/seed_usuarios_default.sql

# Verificar usuários no banco
$env:PGPASSWORD='123456'; psql -U postgres -d asa_db -h localhost -c "SELECT id, nome, email, tipo, papel FROM usuarios WHERE email IN ('admin@asa.com', 'back@asa.com', 'gestor-pj@asa.com', 'consultor@asa.com') ORDER BY email;"
```