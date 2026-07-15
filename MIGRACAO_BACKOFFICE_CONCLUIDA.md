# 🎉 Migração BACKOFFICE Concluída

## ✅ O Que Foi Feito

### 1. Banco de Dados
- [x] Script de migração SQL criado (`packages/database/sql/migrate_gestor_pf_to_backoffice.sql`)
- [x] Script de rollback criado (`packages/database/sql/rollback_migrate_gestor_pf_to_backoffice.sql`)
- [x] Tabela `gestores_pf` → `backoffices`
- [x] Tabela `uploads_planilha_pf` → `uploads_planilha_backoffice`
- [x] Colunas `gestor_pf_id` → `backoffice_id` (8 tabelas)
- [x] Índices e constraints renomeados

### 2. Prisma Schema
- [x] Model `GestorPF` → `Backoffice`
- [x] Model `UploadPlanilhaPF` → `UploadPlanilhaBackoffice`
- [x] Enums atualizados: `GESTOR_PF` → `BACKOFFICE`
- [x] Todas as relações atualizadas

### 3. Backend (API)
- [x] Diretório renomeado: `/api/v1/gestor-pf/` → `/api/v1/backoffice/`
- [x] API helpers: `requireGestorPF()` → `requireBackoffice()`
- [x] API helpers: `requireGestorPFWithScope()` → `requireBackofficeWithScope()`
- [x] Variáveis: `gestorPfId` → `backofficeId`
- [x] Prisma client: `prisma.gestorPF` → `prisma.backoffice`

### 4. Frontend (Next.js)
- [x] Diretório renomeado: `/app/(dashboard)/gestor-pf/` → `/app/(dashboard)/backoffice/`
- [x] Componentes: `/components/gestor-pf/` → `/components/backoffice/`
- [x] Sidebar atualizada
- [x] Navegação atualizada
- [x] Rotas: `/gestor-pf/` → `/backoffice/`

### 5. Types e Schemas
- [x] `packages/shared/src/types.ts`: Tipo `BACKOFFICE` adicionado
- [x] `packages/shared/src/schemas.ts`: Schemas renomeados
- [x] `apps/web/types/next-auth.d.ts`: Types atualizados

### 6. Seeds e Scripts
- [x] `seed.ts` atualizado
- [x] `seed-users.ts` atualizado
- [x] `seed_parceiro_tania.sql` atualizado
- [x] `seed_usuarios_default.sql` atualizado
- [x] `seed_gestor_pf.sql` → `seed_backoffice.sql`
- [x] `fix-papel.ts` atualizado

### 7. Middleware e Auth
- [x] `middleware.ts`: Rotas e redirecionamentos atualizados
- [x] `login/page.tsx`: Redirecionamentos atualizados
- [x] Tipos de usuário: `GESTOR_PF` → `BACKOFFICE`

---

## 📋 Próximos Passos

### 1. Gerar Novo Prisma Client
```bash
cd packages/database
npx prisma generate
```

### 2. Rodar Migração no Banco de Desenvolvimento
```bash
psql -U postgres -d asa_db -h localhost -f packages/database/sql/migrate_gestor_pf_to_backoffice.sql
```

### 3. Validar Types
```bash
npm run typecheck
```

### 4. Rodar Testes
```bash
npm run test
npm run test:e2e
```

### 5. Testar Manualmente
- [ ] Login como backoffice
- [ ] Acessar `/backoffice/dashboard`
- [ ] Navegar por todas as páginas
- [ ] Testar upload de planilhas
- [ ] Testar distribuição de pontos
- [ ] Testar aprovação de resgates

---

## 🚀 Deploy em Produção

### Pré-requisitos
- [ ] Backup completo do banco de produção
- [ ] Validação em staging
- [ ] Rollback testado
- [ ] Janela de manutenção agendada

### Passos
1. Aplicar migração SQL em produção
2. Deploy do código
3. Regenerar Prisma client
4. Validar funcionalidades
5. Monitorar logs por 48h

---

## 📝 Notas Importantes

### Compatibilidade
- Aliases deprecated mantidos por 30 dias:
  - `requireGestorPF` → `requireBackoffice`
  - `requireGestorPFWithScope` → `requireBackofficeWithScope`

### Quebras de Compatibilidade
- URLs antigas `/gestor-pf/*` não funcionam mais (exceto se mantido alias no middleware)
- Variáveis de ambiente com `GESTOR_PF` devem ser atualizadas para `BACKOFFICE`
- Sessions ativas serão invalidadas (necessário logout)

### Monitoramento
Fique atento a:
- Erros de tipo `GESTOR_PF` em logs
- Referências a `gestorPfId` em código legado
- Queries SQL com tabelas antigas

---

## 🆘 Rollback

Em caso de problemas, execute:
```bash
psql -U postgres -d asa_db -h localhost -f packages/database/sql/rollback_migrate_gestor_pf_to_backoffice.sql
```

E reverta o deploy do código.

---

**Data da Migração:** 2026-07-12  
**Responsável:** Time de Desenvolvimento  
**Status:** ✅ Concluída