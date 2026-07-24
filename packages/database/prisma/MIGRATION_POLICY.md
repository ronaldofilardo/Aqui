# Política de Migrations e Banco de Dados

**Status:** Obrigatória  
**Escopo:** Qualquer alteração no `schema.prisma` do pacote `packages/database` e execução de testes

---

## Regra 1 — Nunca executar SQL manual direto no banco de desenvolvimento

- **Proibido:** Rodar `ALTER TABLE`, `CREATE TYPE`, `DROP COLUMN` etc. diretamente via `psql`, `prisma db execute --file ...` ou scripts manuais em `prisma/migrations/`.
- **Motivo:** Destrói o histórico de migrations, causa drift, força reset e pode apagar dados.
- **Exceção:** Apenas em incidentes de produção com autorização explícita e registro em issue.

---

## Regra 2 — Nunca usar `--force` no `prisma migrate dev`

- **Proibido:** `prisma migrate dev --force`, `prisma migrate reset --force` ou qualquer flag que ignore warnings.
- **Motivo:** Dropa toda a base de desenvolvimento sem revisão.
- **Cenário correto:** Se o migrate pedir reset, **pare** e revise o drift primeiro.

---

## Regra 3 — Testes DEVEM usar apenas `asa_db_test`

- **Proibido:** Executar testes com `DATABASE_URL` apontando para `asa_db` em qualquer ambiente de teste.
- **Obrigatório:** `NODE_ENV=test` + `DATABASE_URL` apontando exclusivamente para `asa_db_test`.
- **Bloqueio técnico:** `packages/database/src/index.ts` lança erro se detectar `/asa_db` em `DATABASE_URL` durante testes.
- **Motivo:** Evita corrupção de dados de desenvolvimento e garante isolamento entre dados reais e dados de teste.

---

## Procedimento Obrigatório para Alterações de Schema

### 1. Antes de alterar
```bash
cd packages/database
npx prisma migrate status
```
Se houver drift, documente e resolva **antes** de tocar no schema.

### 2. Alterar o schema
Edite `prisma/schema.prisma`.

### 3. Gerar migration
```bash
npx prisma migrate dev --name descricao_da_mudanca
```
Se pedir reset: **NÃO prossiga**. Volte ao passo 1.

### 4. Aplicar em dev
O `migrate dev` já aplica a migration no banco local. Não execute SQL adicional.

### 4.1 Configurar banco de teste
- Crie o banco `asa_db_test` localmente: `CREATE DATABASE asa_db_test;`
- Configure `.env.test` em `packages/database/.env.test` e `apps/web/.env.test` com `DATABASE_URL` apontando para `asa_db_test`
- O vitest carrega `.env.test` automaticamente via `vitest.config.ts`

### 5. Validar
```bash
# Na raiz do projeto
pnpm build
pnpm test
```

---

## Checklist Antes de Qualquer PR

- [ ] Nenhum arquivo `.sql` manual em `prisma/migrations/`
- [ ] `npx prisma migrate status` mostra "up to date"
- [ ] `npx prisma migrate diff` retorna migration vazia
- [ ] Nenhuma flag `--force` usada no histórico local
- [ ] Em testes: `NODE_ENV=test` e `DATABASE_URL` aponta para `asa_db_test` (validação automática em `packages/database/src/index.ts`)

---

## Incidente: Drift Detectado

Se `prisma migrate dev` acusar drift:

1. **NÃO use `--force`**
2. Rode `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datasource prisma/schema.prisma --script`
3. Crie uma migration que aplica exatamente esse SQL
4. Rode `prisma migrate dev` normalmente

---

## Histórico de Incidentes

| Data | Erro | Causa Raiz | Correção |
|------|------|------------|----------|
| 2026-07-19 | Reset do banco apagou dados | SQL manual + drift não gerenciado | Migration própria criada, SQLs manuais removidas |
| 2026-07-19 | Testes usando `asa_db` (banco de desenvolvimento) | Falta de validação de banco em testes | Bloqueio técnico adicionado em `packages/database/src/index.ts` para impedir uso de `asa_db` em `NODE_ENV=test` |

---

**Esta política é vinculante.** Qualquer desvio deve ser registrado em issue com justificativa e aprovado antes da execução.
