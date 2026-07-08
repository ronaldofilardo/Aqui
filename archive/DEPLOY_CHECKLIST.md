# ✅ Deploy Vercel - Checklist de Preparação

## 📋 Resumo do que foi preparado

### ✅ Validação de Build

```
Status: PASSADO
├─ @asa/shared    → tsc ✅
├─ @asa/database  → tsc ✅
└─ @asa/web       → next build ✅
   ├─ 40 páginas estáticas
   ├─ Linting OK
   └─ Types OK
```

### 📁 Arquivos criados para deploy

#### 1️⃣ `vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next",
  "projectSettings": { ... }
}
```

✅ Configuração de monorepo pronta

#### 2️⃣ `.vercelignore`

```
.env.local
.env.test
.turbo
.git
node_modules
...
```

✅ Ignora arquivos desnecessários

#### 3️⃣ `VERCEL_DEPLOYMENT.md`

```
- Guia completo de variáveis de ambiente
- Troubleshooting
- Comandos de deploy
- Migrations guide
```

✅ Documentação pronta

### 🔐 Variáveis de Ambiente Necessárias

Adicione no **Vercel Dashboard → Settings → Environment Variables**:

```
DATABASE_URL        → [CONFIGURE_VIA_VERCEL_UI_ONLY]
NEXTAUTH_SECRET     → [GERE_COM: openssl rand -base64 32]
NEXTAUTH_URL        → https://seu-dominio.vercel.app
AUTH_SECRET         → [MESMO_QUE_NEXTAUTH_SECRET]
```

⚠️ **CRÍTICO**: NUNCA copie/comita secrets no repositório.

### 🚀 Próximas Ações

1. **Vercel Dashboard Setup**
   - [ ] Criar novo projeto
   - [ ] Conectar repositório GitHub
   - [ ] Configurar Build & Development Settings
   - [ ] Adicionar variáveis de ambiente

2. **Environment Variables**
   - [ ] DATABASE_URL testada
   - [ ] NEXTAUTH_SECRET regenerado
   - [ ] NEXTAUTH_URL configurada
   - [ ] AUTH_SECRET = NEXTAUTH_SECRET

3. **Deploy**
   - [ ] Push para master (ou branch configurada)
   - [ ] Vercel fará build automático
   - [ ] Monitorar logs em Vercel Dashboard

4. **Pós-Deploy**
   - [ ] Executar migrations: `pnpm db:migrate`
   - [ ] Testar login → verificar autenticação
   - [ ] Validar conectividade de API
   - [ ] Monitorar erro logs

### 📊 Build Info

| Métrica           | Valor      |
| ----------------- | ---------- |
| Framework         | Next.js 14 |
| Build Time        | ~50s       |
| First Load JS     | 96.1 kB    |
| Shared Chunks     | 87.3 kB    |
| Middleware Size   | 144 kB     |
| Páginas Estáticas | 40         |
| Rotas API         | 33+        |

### ⚠️ Pontos Importantes

```
🔴 NÃO FAZER:
  - Deixar NODE_ENV=production em .env.local
  - Fazer push de .env.local ou .env.production
  - Usar DATABASE_URL de DEV/TEST em produção (use neondb Neon)

🟢 FAZER:
  - Usar DATABASE_URL de Neon (neondb)
  - Regenerar NEXTAUTH_SECRET para produção
  - Testar build localmente antes de push
  - Monitorar logs no Vercel Dashboard
```

### 🛠️ Vercel CLI (opcional)

```bash
# Instalar
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod
```

---

**Repositório**: Monorepo pnpm + Turbo  
**Aplicação**: Next.js 14 + App Router  
**Banco**: PostgreSQL (Neon neondb)  
**Auth**: NextAuth v5

**✅ Pronto para deploy em Vercel!**
