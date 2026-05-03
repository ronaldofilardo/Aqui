# 🔑 Valores Exatos para Vercel — Copiar & Colar

## ✅ Valores Prontos (Production)

### 1. NEXTAUTH_SECRET

**Gere um novo valor seguro:**

```bash
openssl rand -base64 32
```

**NUNCA use valores de exemplo ou documentação em produção.**

---

### 2. NEXTAUTH_URL

**Configure seu domínio:**

```
https://seu-dominio.vercel.app
```

---

### 3. AUTH_SECRET

**IDÊNTICO ao NEXTAUTH_SECRET — use o mesmo valor gerado acima.**

---

### 4. DATABASE_URL

**Configure em Vercel Environment Variables**

```
[CONFIGURE_IN_VERCEL_DASHBOARD_ONLY]
```

⚠️ **NUNCA copie database URLs em documentação ou repositório. Use apenas Vercel UI.**

---

## 📋 Instruções Passo-a-Passo no Vercel

1. **Abra o Vercel Dashboard:**
   - https://vercel.com/ronaldofilardo/asaquii/settings

2. **Vá para "Environment Variables"**

3. **Para cada variável abaixo, repita:**
   - Clique em **"Add Environment Variable"**
   - Cole o **Nome** (coluna esquerda)
   - Cole o **Valor** (coluna direita)
   - Selecione **Ambientes**: Production ✅ Preview ✅ Development ✅
   - Clique **"Save"**

---

## 🎯 Resumo da Configuração

| Nome                | Valor                                  | Origem                |
| ------------------- | -------------------------------------- | --------------------- |
| **NEXTAUTH_SECRET** | `[GERE_COM: openssl rand -base64 32]`  | Novo para cada deploy |
| **NEXTAUTH_URL**    | `https://seu-dominio.vercel.app`       | Configure seu domínio |
| **AUTH_SECRET**     | `[MESMO_QUE_NEXTAUTH_SECRET]`          | Idêntico              |
| **DATABASE_URL**    | `[CONFIGURE_EM_VERCEL_DASHBOARD_ONLY]` | Neon Cloud (prod)     |

---

## ⚠️ Importante

- **NEXTAUTH_SECRET e AUTH_SECRET devem ser IDÊNTICOS**
- **DATABASE_URL aponta para PRODUÇÃO** (Neon neondb)
- **Todos os 4 valores devem estar marcados para Production/Preview/Development**

---

## ✅ Após Salvar Todas as 4 Variáveis

1. Vá para **Deployments**
2. Encontre o último deployment (que falhou)
3. Clique em **"Redeploy"** ou **"..."** → **"Redeploy"**
4. Aguarde 2-3 minutos para build completar
5. Acesse **https://asaquii.vercel.app** para testar

---

## 🐛 Se Ainda der Erro

1. Vá para **Deployments** → seu deployment
2. Clique em **"Runtime Logs"**
3. Procure por mensagens de erro
4. Se for `NEXTAUTH_SECRET`, verifique se copiou certo (sem espaços)

---

**Pronto! Copie os valores acima e coloque no Vercel Dashboard.**
