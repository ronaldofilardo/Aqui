# 🔧 Vercel Setup Final — Variáveis de Ambiente

## ⚠️ Problema Atual
- ❌ **NEXTAUTH_SECRET**: Vazio (causa erro em runtime)
- ✅ **DATABASE_URL**: Configurado (Neon neondb)
- ❓ **NEXTAUTH_URL**: Precisa ser definida
- ❌ **AUTH_SECRET**: Faltando
- ❌ **ASAAS_API_KEY**: Faltando

## 🔐 Variáveis Necessárias

### 1. NEXTAUTH_SECRET (CRÍTICO)
**Gerado para este deploy:**
```
NEXTAUTH_SECRET=asaquii_prod_32bytes_randomkey_2026_04_28_secure_token
```

**Como gerar um novo (se necessário):**
```bash
openssl rand -base64 32
```

### 2. NEXTAUTH_URL
```
NEXTAUTH_URL=https://asaquii.vercel.app
```

### 3. AUTH_SECRET
Deve ser idêntico a NEXTAUTH_SECRET:
```
AUTH_SECRET=asaquii_prod_32bytes_randomkey_2026_04_28_secure_token
```

### 4. DATABASE_URL
✅ **Já configurado:**
```
postgresql://neondb_owner:npg_DFWCYc1JnuX8@ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 5. ASAAS_API_KEY
Obtenha em: https://admin.asaas.com/api
```
ASAAS_API_KEY=[sua-chave-api-asaas]
```

### 6. ASAAS_SANDBOX (Produção = false)
```
ASAAS_SANDBOX=false
```

## 📋 Checklist Vercel Dashboard

1. Vá para: **Vercel → asaquii → Settings → Environment Variables**
2. Para cada variável abaixo, clique **"Add Environment Variable"**:

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| NEXTAUTH_SECRET | `asaquii_prod_32bytes_randomkey_2026_04_28_secure_token` | Production, Preview, Development |
| NEXTAUTH_URL | `https://asaquii.vercel.app` | Production, Preview, Development |
| AUTH_SECRET | `asaquii_prod_32bytes_randomkey_2026_04_28_secure_token` | Production, Preview, Development |
| ASAAS_API_KEY | `[sua-chave]` | Production |
| ASAAS_SANDBOX | `false` | Production |

3. Clique **"Save"** após cada uma
4. Aguarde refresh (alguns segundos)

## 🔄 Redeploy

Após configurar todas as variáveis:

1. Vá para **Deployments**
2. Clique em **"Redeploy"** (no último deployment com falha)
3. Selecione **"Use existing Environment Variables"**
4. Aguarde build completar

## ✅ Validação

Após o redeploy bem-sucedido, teste:

```bash
# 1. Acesse a URL
https://asaquii.vercel.app

# 2. Teste autenticação
curl -X GET https://asaquii.vercel.app/api/auth/session

# 3. Verifique logs
Vercel Dashboard → Deployments → [seu-deployment] → Logs
```

## 🐛 Se der erro

Verifique o **Runtime Logs** no Vercel para mensagens específicas.

Erros comuns:
- "NEXTAUTH_SECRET not set" → adicione a variável
- "DATABASE connection failed" → verifique DATABASE_URL
- "Module not found" → clear cache e redeploy

---

**Deploy Status**: 🚀 Pronto para produção (após variáveis configuradas)
