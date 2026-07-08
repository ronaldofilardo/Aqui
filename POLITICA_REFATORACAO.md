# Política de Refatoração - ASA Monorepo

## Visão Geral da Arquitetura

Este é um **monorepo** usando Turborepo com a seguinte estrutura:

```
asa-monorepo/
├── apps/web/              # Next.js application
├── packages/database/     # Prisma ORM & migrations
├── packages/shared/       # Shared types & schemas (Zod)
└── docs/                  # Documentation
```

**Stack Principal:**
- **Frontend:** Next.js 14+ (App Router), React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js
- **Validation:** Zod schemas
- **Testing:** Vitest, Cypress (E2E)

---

## Regra de Ouro: Limite de 500 Linhas

**Nenhum arquivo deve exceder 500 linhas.** Arquivos maiores devem ser refatorados obrigatoriamente.

### Condição Mandatory: Zero Quebras ou Regressões

**ANTES de iniciar qualquer refatoração:**

1. ✅ **Testes Existentes:** Todos os testes devem passar antes da refatoração
   ```bash
   pnpm test
   ```

2. ✅ **Build Atual:** O build deve estar funcionando
   ```bash
   pnpm build
   ```

3. ✅ **Snapshot de Comportamento:** Documentar comportamento atual
   - Capturar inputs/outputs de funções principais
   - Screenshot de páginas (se aplicável)
   - Logs de API responses

4. ✅ **Versionamento:** Criar branch específica para refatoração
   ```bash
   git checkout -b refactor/nome-do-arquivo
   ```

**DURANTE a refatoração:**

- ✅ Manter assinatura de funções públicas (ou criar adapters)
- ✅ Não remover exports existentes (ou manter deprecated com warning)
- ✅ Preservar comportamento de edge cases
- ✅ Commits atômicos e reversíveis

**APÓS a refatoração:**

1. ✅ **Todos os testes passam:** `pnpm test` deve ser 100% verde
2. ✅ **Build bem-sucedido:** `pnpm build` sem errors ou warnings críticos
3. ✅ **Teste manual crítico:** Validar fluxos principais afetados
4. ✅ **Code review:** Outro desenvolvedor deve revisar mudanças
5. ✅ **Rollback plan:** Ter plano de rollback testado se necessário

**Critério de Aceite:**
- ❌ Se qualquer teste falhar → REFAZER a refatoração
- ❌ Se build falhar → REFAZER a refatoração
- ❌ Se comportamento mudar → REFAZER a refatoração
- ✅ Somente prosseguir se 100% idêntico ao comportamento anterior

### Arquivos Críticos Atuais (Prioridade de Refatoração)

| Arquivo | Linhas | Prioridade | Ação Necessária |
|---------|--------|------------|-----------------|
| `apps/web/app/(dashboard)/gestor-pf/configuracoes/comissoes-gestao/page.tsx` | 1271 | 🔴 CRÍTICA | Extrair hooks, componentes e utils |
| `apps/web/app/(dashboard)/gestor-pf/pontos/page.tsx` | 642 | 🔴 CRÍTICA | Extrair hooks e componentes |
| `apps/web/app/api/v1/gestor-pf/uploads/route.ts` | 563 | 🔴 CRÍTICA | Separar handlers e services |
| `apps/web/app/(dashboard)/gestor-pf/producao/relatorios/page.tsx` | 519 | 🟠 ALTA | Extrair componentes de UI |
| `apps/web/app/(dashboard)/gestor/consultores/page.tsx` | 500 | 🟠 ALTA | Limite atingido - prevenir crescimento |

---

## Princípios de Refatoração

### 1. Separação de Responsabilidades

#### Pages (Next.js)
```
❌ RUIM: Tudo na page.tsx
- Lógica de negócio
- Fetch de dados
- UI components
- Types inline

✅ BOM:
page.tsx
├── Componentes da página (extraídos)
├── Hooks customizados (useX.ts)
├── Types dedicados (types.ts)
└── Server actions (actions.ts)
```

#### API Routes
```
❌ RUIM: Tudo no route.ts
- Validação
- Regras de negócio
- Queries do banco
- Response formatting

✅ BOM:
route.ts (máx 100 linhas)
├── services/ (regras de negócio)
├── validators/ (schemas Zod)
├── responses/ (format helpers)
└── types/ (types específicos)
```

### 2. Estrutura de Pastas Recomendada

```
apps/web/
├── app/
│   ├── (dashboard)/
│   │   └── gestor-pf/
│   │       ├── configuracoes/
│   │       │   └── comissoes-gestao/
│   │       │       ├── page.tsx (máx 200 linhas)
│   │       │       ├── components/
│   │       │       │   ├── comerciais-list.tsx
│   │       │       │   ├── metas-form.tsx
│   │       │       │   ├── comissoes-table.tsx
│   │       │       │   └── regras-panel.tsx
│   │       │       ├── hooks/
│   │       │       │   ├── use-comerciais.ts
│   │       │       │   ├── use-metas.ts
│   │       │       │   └── use-comissoes.ts
│   │       │       ├── actions.ts
│   │       │       └── types.ts
│   │       │
│   │       └── pontos/
│   │           └── ... (mesma estrutura)
│   │
│   └── api/v1/
│       └── gestor-pf/
│           ├── uploads/
│           │   ├── route.ts (máx 100 linhas)
│           │   ├── service.ts (regras de negócio)
│           │   ├── parser.ts (planilha parsing)
│           │   ├── validator.ts (validações)
│           │   └── types.ts
│           │
│           └── ...
│
├── components/
│   ├── ui/ (componentes genéricos)
│   ├── gestor-pf/ (componentes específicos)
│   └── parceiro/
│
├── lib/
│   ├── api-helpers.ts (máx 300 linhas - dividir se crescer)
│   ├── pontos-utils.ts (máx 300 linhas)
│   ├── auth.ts (máx 300 linhas)
│   └── ...
│
└── hooks/ (hooks globais reutilizáveis)
```

### 3. Patterns de Extração

#### Extração de Hooks Customizados

**Antes (na page.tsx):**
```tsx
export default function Page() {
  const [comerciais, setComerciais] = useState([]);
  const [loading, setLoading] = useState(true);
  
  async function fetchComerciais() {
    setLoading(true);
    const res = await fetch("/api/v1/gestor-pf/comerciais");
    const data = await res.json();
    setComerciais(data);
    setLoading(false);
  }
  
  useEffect(() => {
    fetchComerciais();
  }, []);
  
  // ... mais 400 linhas
}
```

**Depois (hook dedicado):**
```tsx
// hooks/use-comerciais.ts
export function useComerciais() {
  const [comerciais, setComerciais] = useState<Comercial[]>([]);
  const [loading, setLoading] = useState(true);
  
  async function fetchComerciais() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/comerciais");
      const data = await res.json();
      setComerciais(data);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    fetchComerciais();
  }, []);
  
  return { comerciais, loading, refetch: fetchComerciais };
}
```

#### Extração de Componentes

**Antes:**
```tsx
export default function Page() {
  return (
    <div>
      <h1>Gestão de Comissões</h1>
      {/* 300 linhas de JSX inline */}
      <table>...</table>
      <form>...</form>
      <modal>...</modal>
    </div>
  );
}
```

**Depois:**
```tsx
export default function ComissoesGestaoPage() {
  return (
    <div>
      <h1>Gestão de Comissões</h1>
      <ComerciaisList />
      <MetasForm />
      <ComissoesTable />
      <RegrasPanel />
    </div>
  );
}
```

#### Extração de Services (API Routes)

**Antes:**
```tsx
// route.ts - 600 linhas
export async function POST(req: NextRequest) {
  // Validação inline
  // Regras de negócio inline
  // Queries do banco inline
  // Response formatting inline
}
```

**Depois:**
```tsx
// route.ts - 50-80 linhas
import { processUploadService } from "./service";
import { validateUploadSchema } from "./validator";

export async function POST(req: NextRequest) {
  const auth = await requireGestorPFWithScope();
  if (auth.error) return auth.error;
  
  const data = await req.formData();
  const validation = validateUploadSchema(data);
  if (!validation.success) return badRequest(validation.error);
  
  const result = await processUploadService(data, auth.gestorPfId);
  return created(result);
}

// service.ts - regras de negócio isoladas
export async function processUploadService(data: FormData, gestorId: string) {
  // ... lógica complexa
}

// validator.ts - schemas Zod
export const uploadSchema = z.object({...});
```

---

## Checklist de Refatoração

### Para Pages (>300 linhas)

- [ ] Extrair componentes UI para `components/`
- [ ] Extrair hooks customizados para `hooks/` ou `./hooks/`
- [ ] Mover types para arquivo dedicado `types.ts`
- [ ] Extrair server actions para `actions.ts`
- [ ] Remover funções utilitárias inline para `lib/`
- [ ] Manter page.tsx com apenas orquestração

### Para API Routes (>200 linhas)

- [ ] Extrair regras de negócio para `service.ts`
- [ ] Extrair schemas de validação para `validator.ts`
- [ ] Extrair parsers para `parser.ts`
- [ ] Extrair response helpers para `responses.ts`
- [ ] Manter route.ts apenas com HTTP handling

### Para Libs (>300 linhas)

- [ ] Identificar domínios distintos
- [ ] Separar em múltiplos arquivos por responsabilidade
- [ ] Criar index.ts para exports
- [ ] Manter coesão interna

---

## Métricas de Qualidade

### Tamanho de Arquivo

| Tipo | Ideal | Máximo | Ação |
|------|-------|--------|------|
| Page.tsx | 100-200 | 300 | Refatorar se >300 |
| Component | 50-150 | 250 | Extrair se >250 |
| API Route | 50-100 | 200 | Separar se >200 |
| Hook | 30-80 | 150 | Dividir se >150 |
| Service | 100-200 | 300 | Modularizar se >300 |
| Lib util | 100-200 | 300 | Separar se >300 |

### Complexidade

- **Funções:** Máximo 30 linhas
- **Parâmetros:** Máximo 4 parâmetros (usar object params se necessário)
- **Nesting:** Máximo 3 níveis de aninhamento
- **Responsabilidades:** 1 função = 1 responsabilidade

---

## Processo de Refatoração

### Passo 1: Identificar
```bash
# Listar arquivos >500 linhas
Get-ChildItem -Recurse -Include *.ts,*.tsx | 
  ForEach-Object { 
    [PSCustomObject]@{
      Path = $_.FullName
      Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    } 
  } | 
  Where-Object { $_.Lines -gt 500 } | 
  Sort-Object Lines -Descending
```

### Passo 2: Analisar
- Identificar responsabilidades misturadas
- Mapear dependências
- Definir boundaries de extração

### Passo 3: Extrair
1. Types primeiro
2. Funções utilitárias
3. Hooks customizados
4. Componentes
5. Services

### Passo 4: Testar
- Rodar testes existentes
- Criar testes para novas unidades
- Validar comportamento

### Passo 5: Commit
```bash
git add .
git commit -m "refactor: extract hooks and components from comissoes-gestao page

- Extract useComerciais, useMetas, useComissoes hooks
- Extract ComerciaisList, MetasForm, ComissoesTable components
- Create dedicated types.ts file
- Keep page.tsx with 180 lines (was 1271)

Part of: refactoring policy - max 500 lines per file"
```

---

## Exemplo Prático: Refatoração de comissoes-gestao/page.tsx

### Estado Atual
- **1271 linhas**
- Múltiplas responsabilidades
- Types inline
- Hooks inline
- Componentes inline

### Estado Desejado

```
comissoes-gestao/
├── page.tsx (180 linhas)
├── components/
│   ├── comerciais-list.tsx (150 linhas)
│   ├── metas-form.tsx (180 linhas)
│   ├── comissoes-table.tsx (200 linhas)
│   ├── regras-panel.tsx (160 linhas)
│   └── comercial-modal.tsx (140 linhas)
├── hooks/
│   ├── use-comerciais.ts (80 linhas)
│   ├── use-metas.ts (100 linhas)
│   ├── use-comissoes.ts (100 linhas)
│   └── use-regras.ts (70 linhas)
├── actions.ts (150 linhas)
├── types.ts (120 linhas)
└── utils.ts (90 linhas)
```

### Total: 10 arquivos, média de 134 linhas cada

---

## Ferramentas Úteis

### PowerShell Scripts

```powershell
# Contar linhas por arquivo
Get-ChildItem -Recurse -Include *.ts,*.tsx | 
  ForEach-Object { 
    [PSCustomObject]@{
      Path = $_.FullName.Replace((Get-Location).Path + "\", "")
      Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    } 
  } | Sort-Object Lines -Descending | Format-Table -AutoSize

# Find files >500 lines
Get-ChildItem -Recurse -Include *.ts,*.tsx | 
  ForEach-Object { 
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lines -gt 500) { 
      [PSCustomObject]@{
        Path = $_.FullName.Replace((Get-Location).Path + "\", "")
        Lines = $lines
      } 
    }
  } | Sort-Object Lines -Descending
```

### VS Code Extensions Recomendadas
- **CodeMetrics** - Complexidade de código
- **TODO Highlight** - Marcar refatorações pendentes
- **Import Cost** - Ver tamanho de imports

---

## Guidelines por Camada

### Database (Prisma)
- Models bem definidos no schema.prisma
- Queries via Prisma Client
- Migrations versionadas
- Seeds para desenvolvimento

### Shared (Types & Schemas)
- Types TypeScript em `packages/shared/src/types.ts`
- Schemas Zod em `packages/shared/src/schemas.ts`
- Constants em `packages/shared/src/constants.ts`
- Máximo 300 linhas por arquivo

### Web (Next.js)
- **Pages:** Apenas orquestração
- **Components:** Reutilizáveis e testáveis
- **Hooks:** Lógica de estado e efeitos
- **Services:** Regras de negócio
- **Utils:** Funções puras e helpers

---

## Prevenção

### Pre-commit Hook
```json
// package.json
{
  "scripts": {
    "pre-commit": "pnpm lint && pnpm check-file-sizes",
    "check-file-sizes": "node scripts/check-file-sizes.js"
  }
}
```

```javascript
// scripts/check-file-sizes.js
const MAX_LINES = 500;
const IGNORE_PATTERNS = [
  '.next/',
  'node_modules/',
  '*.test.ts',
  '*.spec.ts'
];

// Check all .ts/.tsx files
// Fail if any file > MAX_LINES
```

### Code Review Checklist
- [ ] Arquivo tem menos de 500 linhas?
- [ ] Funções têm menos de 30 linhas?
- [ ] Componentes são reutilizáveis?
- [ ] Hooks estão extraídos?
- [ ] Types estão em arquivo dedicado?
- [ ] Regras de negócio estão em services?

---

## Documentação Relacionada

- `docs/ARCHITECTURE_IMPROVEMENTS.md` - Melhorias de arquitetura
- `docs/SISTEMA_PONTOS_IMPLEMENTACAO.md` - Sistema de pontos
- `docs/TESTES_COMPLETOS_COMISSOES.md` - Testes de comissões

---

## Revisão e Atualização

Esta política deve ser revisada trimestralmente e atualizada conforme:
- Novos padrões da indústria
- Mudanças na stack tecnológica
- Lições aprendidas em refatorações
- Feedback do time

**Última atualização:** Julho 2026
**Próxima revisão:** Outubro 2026