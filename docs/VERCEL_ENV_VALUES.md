# 🔑 Valores Exatos para Vercel — Copiar & Colar

## ✅ Valores Prontos (Production)

### 1. NEXTAUTH_SECRET

**Copie e cole exatamente:**

```
MjcwZjU4YWM3ZTM5MzAyYjg1ZmJjMTcyODk0YTcwYWRhOTU4ZTQ4ZjJhYmY5NTYxNDI5ZmVkYzc2ZjIwYzQxYQ==
```

---

### 2. NEXTAUTH_URL

**Copie e cole:**

```
https://asaquii.vercel.app
```

---

### 3. AUTH_SECRET

**IDÊNTICO ao NEXTAUTH_SECRET — copie:**

```
MjcwZjU4YWM3ZTM5MzAyYjg1ZmJjMTcyODk0YTcwYWRhOTU4ZTQ4ZjJhYmY5NTYxNDI5ZmVkYzc2ZjIwYzQxYQ==
```

---

### 4. DATABASE_URL

**Copie e cole (produção Neon):**

```
postgresql://neondb_owner:npg_DFWCYc1JnuX8@ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

### 5. ASAAS_API_KEY

**⚠️ Precisa obter em:** https://admin.asaas.com/config/api

Após gerar a chave na plataforma Asaas, será algo como:

```
[sua-chave-aqui-começa-com-$aact_ ou $aas_]
```

Exemplo (fictício):

```
$aact_YWJjZGVmZ2hpamtsbW5vcA==
```

---

### 6. ASAAS_SANDBOX

**Para produção, copie:**

```
false
```

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

| Nome                | Valor                                                                                      | Origem                  |
| ------------------- | ------------------------------------------------------------------------------------------ | ----------------------- |
| **NEXTAUTH_SECRET** | `MjcwZjU4YWM3ZTM5MzAyYjg1ZmJjMTcyODk0YTcwYWRhOTU4ZTQ4ZjJhYmY5NTYxNDI5ZmVkYzc2ZjIwYzQxYQ==` | Gerado para este deploy |
| **NEXTAUTH_URL**    | `https://asaquii.vercel.app`                                                               | Domínio Vercel          |
| **AUTH_SECRET**     | `MjcwZjU4YWM3ZTM5MzAyYjg1ZmJjMTcyODk0YTcwYWRhOTU4ZTQ4ZjJhYmY5NTYxNDI5ZmVkYzc2ZjIwYzQxYQ==` | Igual a NEXTAUTH_SECRET |
| **DATABASE_URL**    | `postgresql://neondb_owner:npg_DFWCYc1JnuX8@...`                                           | Neon Cloud (prod)       |
| **ASAAS_API_KEY**   | `[sua-chave-asaas]`                                                                        | Asaas Dashboard         |
| **ASAAS_SANDBOX**   | `false`                                                                                    | Produção = false        |

---

## ⚠️ Importante

- **NEXTAUTH_SECRET e AUTH_SECRET devem ser IDÊNTICOS**
- **DATABASE_URL aponta para PRODUÇÃO** (Neon neondb)
- **ASAAS_SANDBOX deve ser `false` em produção**
- **Todos os 6 valores devem estar marcados para Production/Preview/Development**

---

## ✅ Após Salvar Todas as 6 Variáveis

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
