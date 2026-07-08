# 📊 Consolidação de Bancos de Dados — 06/05/2026

## 📋 Resumo da Mudança

**Antes** (5 bancos):

- ❌ nr-bps_db (DEV)
- ❌ nr-bps_db_test (TEST)
- ❌ asa_db_test (TEST obsoleto)
- ❌ neondb_staging (STAGING)
- ✅ neondb / neondb_v2 (PROD)

**Depois** (2 bancos):

- ✅ **asa_db** (LOCAL DEV - PostgreSQL localhost)
- ✅ **neondb** (PRODUCTION - Neon Cloud)

---

## 🔧 Configuração Obrigatória

### .env.local (Desenvolvimento Local)

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/asa_db"
NODE_ENV="development"
```

**Exemplo para DEV (substituir USER e PASSWORD com seus valores locais):**

```bash
DATABASE_URL="postgresql://postgres:your_local_password@localhost:5432/asa_db"
```

⚠️ **NUNCA adicione:**

- `NODE_ENV=production` em `.env.local`
- `ALLOW_PROD_DB_LOCAL=true`
- Credenciais de produção em arquivos

Isso causará erro 405 em rotas PATCH do App Router.

### .env.production (Vercel - Production)

```bash
DATABASE_URL=[CONFIGURE_VIA_VERCEL_DASHBOARD_ONLY]
NODE_ENV="production"
```

⚠️ **Configure APENAS no Vercel Dashboard → Project Settings → Environment Variables**

**NUNCA coloque connection strings de produção em arquivos ou repositório.**

---

## ✅ Verificação de Migração

### 1. Local - Conectar ao asa_db

```bash
psql -h localhost -U postgres -d asa_db -c "\dt"
```

Esperado: Tabelas públicas listadas (usuários, consultores, etc.)

### 2. Production - Conectar ao neondb

```bash
# Use as credenciais configuradas em Vercel Environment Variables
# Nunca coloque a connection string aqui
psql "postgresql://USER:PASSWORD@neondb-host/neondb?sslmode=require" -c "\dt"
```

Esperado: Schema e tabelas sincronizados

⚠️ **As credenciais reais estão configuradas apenas no Vercel Dashboard.**

---

## 🗑️ Limpeza Recomendada

### No PostgreSQL Local

```sql
-- Remover bancos antigos (opcional)
DROP DATABASE IF EXISTS nr-bps_db;
DROP DATABASE IF EXISTS nr-bps_db_test;
DROP DATABASE IF EXISTS asa_db_test;

-- Manter apenas
-- asa_db (ativo)
```

### No Neon Cloud

Não remover `neondb_staging` ou `neondb_v2` manualmente sem backup.

Use Neon Dashboard → Project Settings → Branches para gerenciar.

---

## 📝 Notas Importantes

1. **Código antigo pode ter referências legadas** — procure por:
   - `nr-bps_db` em comentários/docs
   - `neondb_staging` em configurações
   - `neondb_v2` em variáveis de ambiente

2. **Migrations do Prisma** — execute quando necessário:

   ```bash
   pnpm db:migrate
   ```

3. **RLS Policies** — continuam igual, baseadas no schema novo

4. **Backups** — `neondb` (production) já tem backups automáticos via Neon

---

## 🔐 Credenciais

### Local (asa_db)

- Usuário: `postgres` (ou seu usuário PostgreSQL local)
- Senha: Configure em `.env.local` (dev only)
- Host: `localhost:5432`
- **⚠️ Nunca comita .env.local no repositório**

### Production (neondb)

- Usuário: `neondb_owner`
- Senha: ✅ **Armazenada APENAS em Vercel Environment Variables**
- Host: Configurado em Vercel
- SSL: `require`
- Channel Binding: `require`
- **⚠️ NUNCA copie ou comita credentials de produção**

---

## ✨ Status

- ✅ Simplificação concluída (06/05/2026)
- ✅ Documentação atualizada
- ⏳ Deploy de validação em andamento
