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
DATABASE_URL="postgresql://postgres:123456@localhost:5432/asa_db"
NODE_ENV="development"
```

⚠️ **NUNCA adicione:**

- `NODE_ENV=production` em `.env.local`
- `ALLOW_PROD_DB_LOCAL=true`

Isso causará erro 405 em rotas PATCH do App Router.

### .env.production (Vercel - Production)

```bash
DATABASE_URL="postgresql://neondb_owner:npg_DFWCYc1JnuX8@ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NODE_ENV="production"
```

⚠️ **Configure APENAS no Vercel Dashboard → Environment Variables**

---

## ✅ Verificação de Migração

### 1. Local - Conectar ao asa_db

```bash
psql -h localhost -U postgres -d asa_db -c "\dt"
```

Esperado: Tabelas públicas listadas (usuários, consultores, etc.)

### 2. Production - Conectar ao neondb

```bash
psql "postgresql://neondb_owner:npg_DFWCYc1JnuX8@ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -c "\dt"
```

Esperado: Schema e tabelas sincronizados

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

- Usuário: `postgres`
- Senha: `123456` (dev only)
- Host: `localhost:5432`

### Production (neondb)

- Usuário: `neondb_owner`
- Senha: (armazenada em Vercel Environment Variables)
- Host: `ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech`
- SSL: `require`
- Channel Binding: `require`

---

## ✨ Status

- ✅ Simplificação concluída (06/05/2026)
- ✅ Documentação atualizada
- ⏳ Deploy de validação em andamento
