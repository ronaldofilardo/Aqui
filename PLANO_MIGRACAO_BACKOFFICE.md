# Plano de Migração: gestor-pf → backoffice

## 📋 Visão Geral

**Objetivo:** Substituir toda ocorrência de `gestor-pf`, `gestor_pf`, `GestorPF`, `GESTOR_PF` por `backoffice`, `back_office`, `Backoffice`, `BACKOFFICE` em todo o código-base, bancos de dados e APIs.

**Contexto:** O perfil `gestor-pf` é o **administrador técnico/operacional** do sistema, responsável por:
- Gerenciar todos os usuários (comerciais, gestores, parceiros)
- Configurar regras de comissão e pontos
- Realizar uploads de planilhas de produção
- Distribuir pontos e aprovar resgates
- Backoffice completo do sistema de pontos e comissionamento

**Hierarquia do Sistema:**
```
┌─────────────────────────────────────┐
│         BACKOFFICE (ADMIN)          │
│  - Admin técnico do sistema         │
│  - Gerencia TODOS os usuários       │
│  - Configura regras globais         │
│  - Upload de planilhas              │
│  - Distribui pontos                 │
│  - Aprova resgates                  │
│  - Backoffice completo              │
└─────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼────┐      ┌────▼────┐
   │GESTOR   │      │COMERCIAL│
   │(Equipe) │      │(Vendas) │
   └─────────┘      └─────────┘
```

**Por que BACKOFFICE e não SUPORTE?**
- ✅ Reflete o caráter administrativo/operacional
- ✅ Diferencia claramente de `GESTOR` (que é comercial)
- ✅ Indica nível hierárquico superior (admin do sistema)
- ✅ Evita confusão com suporte técnico/atendimento
- ✅ Termo comum em sistemas SaaS para backoffice

**Escopo:** Backend, Frontend, Banco de Dados, Migrações, Seeds, Tests, Documentação

---

## 🗂️ 1. BANCO DE DADOS

### 1.1 Tabelas a Renomear

| Tabela Atual | Nova Tabela | Justificativa |
|--------------|-------------|---------------|
| `gestores_pf` | `backoffices` | Entidade central do backoffice |
| `uploads_planilha_pf` | `uploads_planilha_backoffice` | Uploads feitos pelo backoffice |

**Nota:** Mantemos o sufixo plural (`backoffices`) para seguir o padrão do Prisma com tabelas no plural.

### 1.2 Colunas a Renomear (Foreign Keys)

| Tabela | Coluna Atual | Nova Coluna |
|--------|--------------|-------------|
| `liderancas` | `gestor_pf_id` | `backoffice_id` |
| `parceiros` | `gestor_pf_id` | `backoffice_id` |
| `configuracoes_pontos` | `gestor_pf_id` | `backoffice_id` |
| `ciclos_pontos` | `gestor_pf_id` | `backoffice_id` |
| `premios` | `gestor_pf_id` | `backoffice_id` |
| `regras_comerciais` | `gestor_pf_id` | `backoffice_id` |
| `regras_gestores` | `gestor_pf_id` | `backoffice_id` |
| `uploads_planilha_pf` | `gestor_pf_id` | `backoffice_id` |

### 1.3 Enums a Atualizar

```sql
-- Adicionar novo valor ao enum TipoUsuario
-- BACKOFFICE será o tipo principal para o admin operacional
ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'BACKOFFICE';

-- Opcional: Manter GESTOR_PF temporariamente para compatibilidade
-- Ou remover gradualmente após migração

-- PapelGestor pode ser substituído por PapelBackoffice se necessário
-- Mas o ideal é usar apenas tipo: "BACKOFFICE"
```

**Hierarquia de Tipos:**
```typescript
type TipoUsuario = 
  | "ADMIN"          // Admin institucional
  | "BACKOFFICE"     // Admin técnico/operacional (NOVO)
  | "GESTOR"         // Gestor comercial (equipe)
  | "COMERCIAL"      // Vendedor
  | "PARCEIRO"       // Parceiro/indicador
  | "CONSULTOR"      // Consultor externo
  | "ESTABELECIMENTO"// Estabelecimento conveniado
```

### 1.4 Script de Migração do Banco

**Arquivo:** `packages/database/sql/migrate_gestor_pf_to_backoffice.sql`

```sql
-- 1. Renomear tabela gestores_pf
ALTER TABLE "gestores_pf" RENAME TO "backoffices";

-- 2. Renomear tabela uploads_planilha_pf
ALTER TABLE "uploads_planilha_pf" RENAME TO "uploads_planilha_backoffice";

-- 3. Renomear colunas de foreign key em todas as tabelas
ALTER TABLE "liderancas" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "parceiros" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "configuracoes_pontos" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "ciclos_pontos" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "premios" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "regras_comerciais" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "regras_gestores" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
ALTER TABLE "uploads_planilha_backoffice" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";

-- 4. Renomear índices
ALTER INDEX "parceiros_gestor_pf_id_idx" RENAME TO "parceiros_backoffice_id_idx";
ALTER INDEX "configuracoes_pontos_gestor_pf_id_idx" RENAME TO "configuracoes_pontos_backoffice_id_idx";
ALTER INDEX "ciclos_pontos_gestor_pf_id_idx" RENAME TO "ciclos_pontos_backoffice_id_idx";
ALTER INDEX "ciclos_pontos_gestor_pf_id_status_idx" RENAME TO "ciclos_pontos_backoffice_id_status_idx";
ALTER INDEX "premios_gestor_pf_id_idx" RENAME TO "premios_backoffice_id_idx";
ALTER INDEX "regras_comerciais_gestor_pf_id_idx" RENAME TO "regras_comerciais_backoffice_id_idx";
ALTER INDEX "regras_comerciais_gestor_pf_id_key" RENAME TO "regras_comerciais_backoffice_id_key";
ALTER INDEX "regras_gestores_gestor_pf_id_idx" RENAME TO "regras_gestores_backoffice_id_idx";
ALTER INDEX "regras_gestores_gestor_pf_id_key" RENAME TO "regras_gestores_backoffice_id_key";
ALTER INDEX "uploads_planilha_pf_gestor_pf_id_idx" RENAME TO "uploads_planilha_backoffice_backoffice_id_idx";
ALTER INDEX "gestores_pf_usuario_id_key" RENAME TO "backoffices_usuario_id_key";
ALTER INDEX "gestores_pf_cpf_key" RENAME TO "backoffices_cpf_key";

-- 5. Renomear constraints de chave única
ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_usuario_id_key" TO "backoffices_usuario_id_key";
ALTER TABLE "backoffices" RENAME CONSTRAINT "gestores_pf_cpf_key" TO "backoffices_cpf_key";

-- 6. Atualizar constraints de chave estrangeira (drop e recreate)
-- Exemplo para liderancas:
ALTER TABLE "liderancas" DROP CONSTRAINT IF EXISTS "liderancas_gestor_pf_id_fkey";
ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Repetir para todas as FKs...

-- 7. Atualizar enum (se possível)
-- Nota: PostgreSQL não permite renomear valores de enum diretamente
-- Será necessário criar novo tipo ou usar casting
```

### 1.5 Arquivos SQL a Atualizar

- [ ] `packages/database/prisma/schema.prisma`
- [ ] `packages/database/sql/seed_gestor_pf.sql` → `seed_backoffice.sql`
- [ ] `packages/database/sql/seed_usuarios_default.sql`
- [ ] `packages/database/sql/migrate_pf_domain_to_production.sql`
- [ ] `packages/database/prisma/seed_usuarios.sql`
- [ ] `packages/database/prisma/seed_parceiro_tania.sql`
- [ ] `packages/database/prisma/migrations/**/*.sql` (todas as migrações existentes)

---

## 🔧 2. BACKEND (Node.js/TypeScript)

### 2.1 Prisma Schema

**Arquivo:** `packages/database/prisma/schema.prisma`

```prisma
// Renomear model
model Backoffice {
  id                        String               @id @default(uuid()) @db.Uuid
  usuarioId                 String               @unique @map("usuario_id") @db.Uuid
  nome                      String               @db.VarChar(255)
  cpf                       String               @unique @db.VarChar(14)
  percentualComissaoDefault Decimal              @default(5.00) @map("percentual_comissao_default") @db.Decimal(5, 2)
  percentualComissaoMax     Decimal              @default(100.00) @map("percentual_comissao_max") @db.Decimal(5, 2)
  createdAt                 DateTime             @default(now()) @map("created_at")
  updatedAt                 DateTime             @updatedAt @map("updated_at")
  
  // Relations...
  @@map("backoffices")
}
```
### 2.2 Types e Schemas

**Arquivo:** `packages/shared/src/types.ts`

```typescript
// Adicionar novo tipo
export type TipoUsuario = "GESTOR" | "CONSULTOR" | "BACKOFFICE";

// Ou substituir GESTOR_PF por BACKOFFICE dependendo da estratégia
```

**Arquivo:** `packages/shared/src/schemas.ts`

```typescript
// Renomear schemas
export const criarBackofficeSchema = z.object({...});
export const atualizarBackofficeSchema = z.object({...});

// Types derivados
export type CriarBackofficeInput = z.infer<typeof criarBackofficeSchema>;
export type AtualizarBackofficeInput = z.infer<typeof atualizarBackofficeSchema>;
```
### 2.3 API Helpers

**Arquivo:** `apps/web/lib/api-helpers.ts`

```typescript
// Renomear funções
export async function requireBackoffice() { ... }
export async function requireBackofficeWithScope() { ... }

// Manter aliases deprecated temporariamente
export const requireGestorPF = requireBackoffice;
export const requireGestorPFWithScope = requireBackofficeWithScope;
```

### 2.4 Middleware

**Arquivo:** `apps/web/middleware.ts`

```typescript
const ROUTE_RULES: Array<{...}> = [
  { prefix: "/admin", allowedTipos: ["ADMIN"] },
  { prefix: "/backoffice", allowedTipos: ["BACKOFFICE"], allowedPapeis: ["BACKOFFICE"] },
  // Manter compatibilidade temporária:
  { prefix: "/gestor-pf", allowedTipos: ["BACKOFFICE"], allowedPapeis: ["BACKOFFICE"] },
  ...
];

function dashboardForPapel(user: SessionUser): string {
  if (user.tipo === "ADMIN") return "/admin/usuarios";
  if (user.tipo === "BACKOFFICE") return "/backoffice/dashboard";
  if (user.tipo === "GESTOR") return "/gestor/dashboard";
  if (user.tipo === "PARCEIRO") return "/parceiro/indicados";
  if (user.tipo === "COMERCIAL") return "/comercial/minha-comissao";
  if (user.tipo === "ESTABELECIMENTO") return "/estabelecimento/dashboard";
  if (user.tipo === "CONSULTOR") return "/consultor/estabelecimentos";
  return "/login";
}
```

### 2.5 Endpoints da API

**Todos os arquivos em:** `apps/web/app/api/v1/gestor-pf/`

**Ações:**
1. Renomear diretório: `apps/web/app/api/v1/gestor-pf/` → `apps/web/app/api/v1/backoffice/`
2. Atualizar todas as rotas internas
3. Atualizar imports e referências

**Endpoints afetados:**
- [ ] `/api/v1/gestor-pf/comerciais` → `/api/v1/backoffice/comerciais`
- [ ] `/api/v1/gestor-pf/comerciais/[id]` → `/api/v1/backoffice/comerciais/[id]`
- [ ] `/api/v1/gestor-pf/comerciais/[id]/comissoes` → `/api/v1/backoffice/comerciais/[id]/comissoes`
- [ ] `/api/v1/gestor-pf/comerciais/[id]/metas` → `/api/v1/backoffice/comerciais/[id]/metas`
- [ ] `/api/v1/gestor-pf/liderancas` → `/api/v1/backoffice/liderancas`
- [ ] `/api/v1/gestor-pf/liderancas/[id]` → `/api/v1/backoffice/liderancas/[id]`
- [ ] `/api/v1/gestor-pf/liderancas/[id]/equipe` → `/api/v1/backoffice/liderancas/[id]/equipe`
- [ ] `/api/v1/gestor-pf/pontos/*` → `/api/v1/backoffice/pontos/*`
- [ ] `/api/v1/gestor-pf/parceiros` → `/api/v1/backoffice/parceiros`
- [ ] `/api/v1/gestor-pf/producao` → `/api/v1/backoffice/producao`
- [ ] `/api/v1/gestor-pf/config` → `/api/v1/backoffice/config`
- [ ] `/api/v1/gestor-pf/regras-comerciais` → `/api/v1/backoffice/regras-comerciais`
- [ ] `/api/v1/gestor-pf/regras-gestores` → `/api/v1/backoffice/regras-gestores`
- [ ] `/api/v1/gestor-pf/relatorio-comissoes` → `/api/v1/backoffice/relatorio-comissoes`
- [ ] `/api/v1/gestor-pf/reprocessar-comissoes` → `/api/v1/backoffice/reprocessar-comissoes`
- [ ] `/api/v1/gestor-pf/uploads` → `/api/v1/backoffice/uploads`

### 2.6 Scripts e Seeds

**Arquivos:**
- [ ] `packages/database/prisma/seed.ts`
- [ ] `packages/database/prisma/seed-users.ts`
- [ ] `packages/database/prisma/fix-papel.ts`
- [ ] `scripts/e2e-*.ts` (todos os scripts de teste)
- [ ] `scripts/debug-comerciais.ts`

---

## 🎨 3. FRONTEND (React/Next.js)

### 3.1 Componentes

**Diretório:** `apps/web/components/gestor-pf/` → `apps/web/components/backoffice/`

**Componentes a renomear:**
- [ ] `fila-resgates.tsx`
- [ ] `gerenciador-ciclos-pontos.tsx`
- [ ] `gerenciador-premios.tsx`
- [ ] `ranking-gestor.tsx` → `ranking-backoffice.tsx`

### 3.2 Sidebar

**Arquivo:** `apps/web/components/sidebar.tsx`

```typescript
const backofficeNav: NavItem[] = [
  { label: "Pontos", href: "/backoffice/pontos", icon: "🎯" },
  { 
    label: "Usuários", 
    href: "/backoffice/usuarios", 
    icon: "👥",
    subItems: [
      { label: "Comerciais", href: "/backoffice/usuarios/comerciais" },
    ]
  },
  ...
];

function getTipoLabel(tipo: string | undefined) {
  if (tipo === "BACKOFFICE") return "Backoffice";
  ...
}
```

### 3.3 Páginas (Dashboard)

**Diretório:** `apps/web/app/(dashboard)/gestor-pf/` → `apps/web/app/(dashboard)/backoffice/`

**Páginas a renomear:**
- [ ] `dashboard/page.tsx`
- [ ] `pontos/page.tsx`
- [ ] `usuarios/comerciais/page.tsx`
- [ ] `producao/upload/page.tsx`
- [ ] `producao/procedimentos/page.tsx`
- [ ] `producao/relatorios/page.tsx`
- [ ] `comissionamento/relatorios/page.tsx`
- [ ] `comissionamento/pagamentos/page.tsx`
- [ ] `configuracoes/page.tsx`
- [ ] `configuracoes/regras/page.tsx`
- [ ] `configuracoes/comissoes/page.tsx`
- [ ] `configuracoes/liderancas/page.tsx`

### 3.4 Hooks e Utils

**Diretórios:**
- `apps/web/app/(dashboard)/gestor-pf/**/hooks/`
- `apps/web/app/(dashboard)/gestor-pf/**/utils.ts`
- `apps/web/app/(dashboard)/gestor-pf/**/types.ts`

### 3.5 Variáveis de Ambiente

**Arquivos:**
- `.env.local`
- `.env.example`
- `.env.production`

**Variáveis a atualizar:**
```bash
# Antigo
GESTOR_PF_DEFAULT_COMISSAO=5.00

# Novo
BACKOFFICE_DEFAULT_COMISSAO=5.00
```

---

## 🧪 4. TESTES

### 4.1 Testes Unitários

**Arquivos:**
- [ ] `apps/web/app/__tests__/*.test.ts`
- [ ] `packages/shared/tests/*.test.ts`

### 4.2 Testes E2E

**Arquivos:**
- [ ] `scripts/e2e-*.ts`
- [ ] `apps/web/cypress/e2e/*.cy.ts`

### 4.3 Atualizar Mocks e Fixtures

Todos os mocks que referenciam `gestor-pf`, `gestorPf`, `GESTOR_PF` devem ser atualizados.

---

## 📚 5. DOCUMENTAÇÃO

### 5.1 Arquivos Markdown

- [ ] `docs/PONTOS_SISTEMA.md`
- [ ] `POLITICA_REFATORACAO.md`
- [ ] `REFACTORING_LIST.md`
- [ ] `TEST_BASELINE.md`
- [ ] `.opencode/plans/*.md`
- [ ] `archive/*.md`

### 5.2 Comentários no Código

Todos os comentários inline e JSDoc devem ser atualizados.

---

## 🔄 6. ESTRATÉGIA DE MIGRAÇÃO

### Fase 1: Preparação (Dia 1-2)

1. **Backup completo do banco de dados**
   ```bash
   pg_dump -U postgres -h localhost asa_db > backup_pre_suporte.sql
   ```

2. **Criar branch de migração**
   ```bash
   git checkout -b feat/migrate-gestor-pf-to-suporte
   ```

3. **Criar scripts de migração**
   - Script SQL para produção
   - Script SQL para desenvolvimento
   - Script de rollback

### Fase 2: Backend (Dia 3-5)

1. **Atualizar Prisma Schema**
   ```bash
   cd packages/database
   # Editar schema.prisma
   npx prisma generate
   ```

2. **Rodar migração no banco de dev**
   ```bash
   psql -U postgres -d asa_db -h localhost -f sql/migrate_gestor_pf_to_suporte.sql
   ```

3. **Atualizar types e schemas compartilhados**
   ```bash
   cd packages/shared
   # Editar types.ts e schemas.ts
   npm run build
   ```

4. **Atualizar API helpers e middleware**

5. **Renomear diretório de endpoints**
   ```bash
   mv apps/web/app/api/v1/gestor-pf apps/web/app/api/v1/suporte
   ```

6. **Atualizar imports em todos os endpoints**

### Fase 3: Frontend (Dia 6-8)

1. **Renomear diretório de componentes**
   ```bash
   mv apps/web/components/gestor-pf apps/web/components/suporte
   ```

2. **Renomear diretório de páginas**
   ```bash
   mv apps/web/app/\(dashboard\)/gestor-pf apps/web/app/\(dashboard\)/suporte
   ```

3. **Atualizar sidebar e navegação**

4. **Atualizar todos os imports**

5. **Atualizar hooks, utils e types**

### Fase 4: Testes (Dia 9-10)

1. **Atualizar todos os testes**
2. **Rodar suite completa de testes**
   ```bash
   npm run test
   npm run test:e2e
   ```

3. **Corrigir falhas**

### Fase 5: Validação (Dia 11-12)

1. **Testar manualmente todas as rotas**
2. **Validar autenticação e autorização**
3. **Testar fluxos completos**
4. **Validar banco de dados**

### Fase 6: Deploy (Dia 13-14)

1. **Criar migration para produção**
2. **Aplicar em staging**
3. **Validar em staging**
4. **Agendar janela de manutenção**
5. **Aplicar em produção**
6. **Monitorar logs e erros**

---

## ⚠️ 7. RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Quebra de compatibilidade | Alto | Manter aliases deprecated por 30 dias |
| Perda de dados na migração | Crítico | Backup completo + teste em staging |
| APIs externas quebradas | Médio | Documentar mudança de endpoints |
| Sessões ativas inválidas | Médio | Invalidate all sessions + force logout |
| Documentação desatualizada | Baixo | Revisar docs antes do deploy |

---

## 📊 8. CHECKLIST DE VALIDAÇÃO

### Backend
- [ ] Prisma schema atualizado
- [ ] Migração do banco executada
- [ ] Types e schemas atualizados
- [ ] API helpers atualizados
- [ ] Middleware atualizado
- [ ] Endpoints renomeados
- [ ] Scripts e seeds atualizados

### Frontend
- [ ] Componentes renomeados
- [ ] Páginas renomeadas
- [ ] Sidebar atualizada
- [ ] Navegação atualizada
- [ ] Hooks e utils atualizados
- [ ] Imports corrigidos

### Testes
- [ ] Testes unitários passando
- [ ] Testes e2e passando
- [ ] Mocks atualizados

### Documentação
- [ ] README atualizado
- [ ] Docs de API atualizados
- [ ] CHANGELOG atualizado

### Produção
- [ ] Backup realizado
- [ ] Migração testada em staging
- [ ] Rollback testado
- [ ] Monitoramento configurado

---

## 🛠️ 9. COMANDOS ÚTEIS

### Buscar todas as ocorrências
```bash
# Code
grep -r "gestor-pf" --include="*.ts" --include="*.tsx" .
grep -r "gestor_pf" --include="*.ts" --include="*.tsx" .
grep -r "GestorPF" --include="*.ts" --include="*.tsx" .
grep -r "GESTOR_PF" --include="*.ts" --include="*.tsx" .

# SQL
grep -r "gestor_pf" --include="*.sql" .
grep -r "gestores_pf" --include="*.sql" .

# Backoffice
grep -r "backoffice" --include="*.ts" --include="*.tsx" .
grep -r "back_office" --include="*.ts" --include="*.tsx" .
grep -r "Backoffice" --include="*.ts" --include="*.tsx" .
grep -r "BACKOFFICE" --include="*.ts" --include="*.tsx" .
```

### Substituição em massa (cuidado!)
```bash
# Apenas em arquivos de código
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/gestor-pf/backoffice/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/gestor_pf/backoffice/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/GestorPF/Backoffice/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/GESTOR_PF/BACKOFFICE/g'
```

### Validar imports quebrados
```bash
npm run typecheck
npm run lint
```

---

## 📝 10. PÓS-MIGRAÇÃO

1. **Monitorar erros por 48h**
2. **Remover aliases deprecated após 30 dias**
3. **Atualizar API docs públicas**
4. **Comunicar mudanças a desenvolvedores**
5. **Atualizar postman/insomnia collections**

---

**Tempo estimado:** 10-14 dias úteis  
**Prioridade:** Alta  
**Risco:** Médio-Alto  
**Rollback:** Possível com backup