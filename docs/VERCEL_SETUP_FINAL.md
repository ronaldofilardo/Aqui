# 🔧 Vercel Setup Final — Variáveis de Ambiente

## ⚠️ Problema Atual

- ❌ **NEXTAUTH_SECRET**: Vazio (causa erro em runtime)
- ✅ **DATABASE_URL**: Configurado (Neon neondb)
- ❓ **NEXTAUTH_URL**: Precisa ser definida
- ❌ **AUTH_SECRET**: Faltando

## 🔐 Variáveis Necessárias

### 1. NEXTAUTH_SECRET (CRÍTICO)

**Gere um novo valor seguro com:**

```bash
openssl rand -base64 32
```

**NUNCA copie valores de documentação. Cada deploy deve ter um secret novo.**

### 2. NEXTAUTH_URL

```
NEXTAUTH_URL=https://seu-dominio.vercel.app
```

### 3. AUTH_SECRET

Deve ser idêntico a NEXTAUTH_SECRET — use o mesmo valor gerado acima.

### 4. DATABASE_URL

✅ **Configure apenas em Vercel Environment Variables UI**

⚠️ **NUNCA em repositório ou documentação.**

## 📋 Checklist Vercel Dashboard

1. Vá para: **Vercel → asaquii → Settings → Environment Variables**
2. Para cada variável abaixo, clique **"Add Environment Variable"**:

| Variável        | Valor                                 | Ambientes                        |
| --------------- | ------------------------------------- | -------------------------------- |
| NEXTAUTH_SECRET | `[GERE_COM: openssl rand -base64 32]` | Production, Preview, Development |
| NEXTAUTH_URL    | `https://seu-dominio.vercel.app`      | Production, Preview, Development |
| AUTH_SECRET     | `[MESMO_QUE_NEXTAUTH_SECRET]`         | Production, Preview, Development |

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
