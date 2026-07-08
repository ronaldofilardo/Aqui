# 🚀 Guia de Deploy na Vercel

## Pré-requisitos

- Projeto conectado ao repositório GitHub
- Conta Vercel ativa
- Acesso ao projeto no Vercel

## Build validado ✅

O build passou com sucesso:

- **Turbo**: 3 pacotes compilados
- **Next.js**: Produção otimizada
- **TypeScript**: Sem erros
- **Tamanho**: ~96 kB First Load JS

## Configuração de Ambiente

Adicione as seguintes variáveis de ambiente no Vercel Dashboard → Project Settings → Environment Variables:

### Base de Dados (obrigatório)

```
[CONFIGURE_IN_VERCEL_DASHBOARD_ONLY]
```

⚠️ **NUNCA copie ou comita database URLs. Configure apenas via Vercel UI.**

### NextAuth (obrigatório)

```
NEXTAUTH_SECRET=[GERE_COM: openssl rand -base64 32]
NEXTAUTH_URL=https://seu-dominio.vercel.app (ou seu domínio customizado)
AUTH_SECRET=[MESMO_QUE_NEXTAUTH_SECRET]
```

📝 Para gerar NEXTAUTH_SECRET seguro:

```bash
openssl rand -base64 32
```

## Checklist de Deploy

- [ ] DATABASE_URL configurada e testada
- [ ] NEXTAUTH_SECRET regenerado e seguro
- [ ] NEXTAUTH_URL apontando para o domínio correto
- [ ] Build validado localmente (`pnpm build` ✅)
- [ ] Sem arquivos `.env` no repositório
- [ ] `.vercelignore` configurado
- [ ] `vercel.json` configurado para monorepo
- [ ] Middleware configurado corretamente
- [ ] Database migrations executadas no Neon
- [ ] Tests passando (`pnpm test`)

## Estrutura do Deploy

```
Root (Monorepo)
├── apps/web/          ← Aplicação Next.js (será deployada)
├── packages/database/ ← Prisma + migrações
└── packages/shared/   ← Código compartilhado
```

Vercel detectará automaticamente:

- Build Command: `pnpm build`
- Output Directory: `apps/web/.next`
- Framework: Next.js 14

## Migrations no Neon

Após o primeiro deploy, execute:

```bash
pnpm db:migrate
```

Ou via Vercel CLI após deploy:

```bash
vercel env pull .env.production.local
DATABASE_URL="your_production_url" pnpm prisma migrate deploy
```

## Troubleshooting

### Erro 405 em PATCH routes

- Causa: `NODE_ENV=production` em `.env.local`
- Solução: Remove `.env.local` antes de fazer push, ou garanta que Vercel não carrega variáveis locais

### Conexão DATABASE_URL falhando

- Verifica IP whitelist do Neon
- Confirma sslmode=require na URL
- Testa conexão: `psql [DATABASE_URL]`

### NextAuth session vazia

- Verifica NEXTAUTH_SECRET é igual em todos os deploys
- Confirma NEXTAUTH_URL em Environment Variables
- Limpa cookies do navegador (Dev Tools → Application → Cookies)

### Build timeout

- Verifica se Turbo cache está desabilitado
- Incrementa Build timeout: Project Settings → Function Timeout
- Valida `pnpm install` localmente antes de push

## Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod
```

## Após Deploy

1. **Testar autenticação**: `/login` → fluxo completo
2. **Validar API**: Verificar chamadas CORS/cookies
3. **Monitorar erros**: Vercel Dashboard → Functions/Logs
4. **Performance**: Vercel Analytics → Vitals

---

**Última atualização**: 28 de abril de 2026
