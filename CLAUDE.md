# AQUI — Convenções de Banco de Dados

> Regra aplicada em TODO o sistema (dev / test / scripts / Prisma / NextAuth / CI / Vercel).

## Ambientes

| Ambiente       | Banco          | Connection string                                              |
| -------------- | -------------- | ------------------------------------------------------------- |
| **Local/dev**  | `aqui_db`      | `postgresql://postgres:123456@localhost:5432/aqui_db`         |
| **Local/test** | `aqui_db_test` | `postgresql://postgres:123456@localhost:5432/aqui_db_test`    |
| **Produção**   | `neondb` (NEON)| via DASHBOARD da Vercel → `DATABASE_URL` do NEON (não commitada) |

## Arquivos de environment

| Arquivo                      | Carrega em                 | Deve apontar para         |
| ---------------------------- | -------------------------- | ------------------------- |
| `.env.local` (apps/web)      | `next dev` (NextAuth)      | **local** (`aqui_db`)     |
| `.env` / `.env.local` (packages/database) | prisma / scripts | **local** (`aqui_db`)     |
| `.env.test` (apps/web + raiz) | testes locais (Vitest)     | **local** (`aqui_db_test`)|
| Vercel Dashboard             | produção                   | **NEON** (`neondb`)        |

## Regras

- **NUNCA** commitar segredos reais (DATABASE_URL de NEON, AUTH_SECRET de produção). `.env.local*` já está em `.gitignore`.
- Scripts temporários que precisem do Prisma client devem rodar de dentro do monorepo (`packages/database/...`) — nunca de fora (ex.: `C:\Users\ronal\AppData\Local\Temp`), pois o `.prisma/client` é resolvido a partir do workspace.
- NextAuth exige `AUTH_SECRET` (ou `NEXTAUTH_SECRET`) em `apps/web/.env.local`. Sem isso → erro `MissingSecret` 500 em `/api/auth/*`.
- Banco de testes é **separado** do de dev; testes devem usar `aqui_db_test`.
- Em produção, todas as secret vêm da Vercel; `.env.production.bak` é só referência (placeholders `REPLACE_WITH_VERCEL_ENV_VAR`).

## Seed / usuários padrão (local `aqui_db`)

Senha padrão de desenvolvimento dos usuários de teste: **`123456`**.

| Email               | Tipo        | Senha  |
| ------------------- | ----------- | ------ |
| `admin@asa.com`     | ADMIN       | 123456 |
| `gestor-pj@asa.com` | GESTOR_PJ   | 123456 |
| `consultor@asa.com` | CONSULTOR   | 123456 |
