# Implementação - Nível Liderança

## FASE 1: Database & Schema

### 1.1 Atualizar schema.prisma

**Arquivo:** `packages/database/prisma/schema.prisma`

#### Adicionar novo enum após `TipoUsuario` existente:
```prisma
enum TipoLideranca {
  COMERCIAL
  GESTOR
}
```

#### Adicionar model `Lideranca` após model `GestorPF`:
```prisma
model Lideranca {
  id            String         @id @default(uuid()) @db.Uuid
  usuarioId     String         @unique @map("usuario_id") @db.Uuid
  nome          String         @db.VarChar(255)
  cpf           String         @unique @db.VarChar(14)
  gestorPfId    String         @map("gestor_pf_id") @db.Uuid
  tipo          TipoLideranca
  status        StatusUsuario  @default(ATIVO)
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  
  usuario       Usuario        @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  gestorPf      GestorPF       @relation(fields: [gestorPfId], references: [id], onDelete: Cascade)
  comerciais    Comercial[]
  gestores      Gestor[]
  
  @@index([gestorPfId])
  @@index([tipo])
  @@map("liderancas")
}
```

#### Adicionar model `Gestor` (nível inferior) após model `Lideranca`:
```prisma
model Gestor {
  id            String      @id @default(uuid()) @db.Uuid
  usuarioId     String      @unique @map("usuario_id") @db.Uuid
  nome          String      @db.VarChar(255)
  cpf           String      @unique @db.VarChar(14)
  liderancaId   String      @map("lideranca_id") @db.Uuid
  percentualComissao Decimal @default(0) @map("percentual_comissao") @db.Decimal(5, 2)
  status        StatusUsuario @default(ATIVO)
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  
  usuario       Usuario     @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  lideranca     Lideranca   @relation(fields: [liderancaId], references: [id], onDelete: Cascade)
  parceiros     Parceiro[]
  procedimentos ProcedimentoPF[]
  
  @@index([liderancaId])
  @@map("gestores")
}
```

#### Atualizar model `Usuario` - adicionar relações:
Adicionar após `comercial: Comercial?`:
```prisma
lideranca       Lideranca?
gestor          Gestor?
```

#### Atualizar model `Comercial` - mudar relação de gestorPfId para liderancaId:
```prisma
model Comercial {
  id                 String              @id @default(uuid()) @db.Uuid
  usuarioId          String              @unique @map("usuario_id") @db.Uuid
  nome               String              @db.VarChar(255)
  cpf                String              @unique @db.VarChar(14)
  liderancaId        String              @map("lideranca_id") @db.Uuid  // MUDAR DE: gestorPfId
  percentualComissao Decimal             @default(0) @map("percentual_comissao") @db.Decimal(5, 2)
  status             StatusUsuario       @default(ATIVO)
  createdAt          DateTime            @default(now()) @map("created_at")
  updatedAt          DateTime            @updatedAt @map("updated_at")
  funcao             FuncaoComercial?
  
  lideranca          Lideranca           @relation(fields: [liderancaId], references: [id], onDelete: Cascade)  // MUDAR DE: gestorPf
  usuario            Usuario             @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  comissoes          ComissaoComercial[]
  metas              MetaComercial[]
  procedimentos      ProcedimentoPF[]
  
  @@index([liderancaId])  // MUDAR DE: @@index([gestorPfId])
  @@map("comerciais")
}
```

#### Atualizar model `Parceiro` - remover gestorPfId e adicionar comercialId/gestorId:
```prisma
model Parceiro {
  id                          String               @id @default(uuid()) @db.Uuid
  usuarioId                   String               @unique @map("usuario_id") @db.Uuid
  nome                        String               @db.VarChar(255)
  cpf                         String               @unique @db.VarChar(14)
  pixChave                    String?              @map("pix_chave") @db.VarChar(100)
  status                      StatusParceiro       @default(ATIVO)
  
  comercialId                 String?              @map("comercial_id") @db.Uuid   // NOVO
  gestorId                    String?              @map("gestor_id") @db.Uuid      // NOVO
  
  desligadoEm                 DateTime?            @map("desligado_em")
  createdAt                   DateTime             @default(now()) @map("created_at")
  updatedAt                   DateTime             @updatedAt @map("updated_at")
  periodicidadeCicloEscolhida PeriodicidadeCiclo?  @map("periodicidade_ciclo_escolhida")
  
  indicacoes                  Indicado[]
  movimentacoesPontos         MovimentacaoPontos[]
  comercial                   Comercial?           @relation(fields: [comercialId], references: [id])  // NOVO
  gestor                      Gestor?              @relation(fields: [gestorId], references: [id])     // NOVO
  usuario                     Usuario              @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  primeiraAcss                PrimeiraAcss[]
  procedimentos               ProcedimentoPF[]
  rankingPosicoes             RankingPosicao[]
  solicitacoesResgate         SolicitacaoResgate[]
  
  @@index([comercialId])  // NOVO
  @@index([gestorId])     // NOVO
  @@map("parceiros")
}
```

#### Atualizar model `ProcedimentoPF` - adicionar gestorId:
Adicionar após `comercial: Comercial?`:
```prisma
gestor           Gestor?            @relation(fields: [gestorId], references: [id])
```

Adicionar após `@@index([comercialId])`:
```prisma
@@index([gestorId])
```

#### Atualizar model `GestorPF` - remover relações diretas:
Remover ou comentar:
```prisma
comerciais                Comercial[]
parceiros                 Parceiro[]
```

### 1.2 Criar Migration

Executar no terminal:
```bash
cd packages/database
npx prisma migrate dev --name add_lideranca_hierarchy
```

### 1.3 Aplicar migration nos bancos de dados

**Banco de desenvolvimento:**
```bash
psql -U postgres -d asa_db -h localhost
# Senha: 123456
```

**Banco de testes:**
```bash
psql -U postgres -d asa_db_test -h localhost
# Senha: 123456
```

### 1.4 Atualizar Prisma Client

```bash
cd packages/database
npx prisma generate
```

---

## FASE 2: Backend - APIs

### 2.1 Criar endpoints de Liderança

**Diretório:** `apps/web/app/api/v1/gestor-pf/liderancas/`

#### POST /api/v1/gestor-pf/liderancas
**Arquivo:** `route.ts`

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  forbidden,
  ok,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { criarLiderancaSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = criarLiderancaSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { nome, email, cpf, telefone, tipo } = parsed.data;
  const cpfClean = cpf.replace(/\D/g, "");

  const existsUsuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existsUsuario) {
    return badRequest("Email já cadastrado no sistema");
  }

  const existsCpf = await prisma.lideranca.findUnique({
    where: { cpf: cpfClean },
  });
  if (existsCpf) {
    return badRequest("CPF já cadastrado como Liderança");
  }

  const gestorPf = await prisma.gestorPF.findUnique({
    where: { id: gestorPfId! },
  });
  if (!gestorPf) {
    return forbidden();
  }

  const senhaTemporaria = cpfClean.substring(0, 5);
  const senhaHash = await hash(senhaTemporaria, 12);

  const token = generateResetToken();
  const tokenHash = hashToken(token);

  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nome,
        email: email.toLowerCase().trim(),
        senhaHash,
        tipo: "LIDERANCA",
        telefone: telefone || undefined,
        senhaTemporaria: true,
      },
    });

    const lideranca = await tx.lideranca.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: cpfClean,
        tipo, // COMERCIAL ou GESTOR
        gestorPfId: gestorPfId!,
        status: "ATIVO",
      },
    });

    await tx.primeiraAcss.create({
      data: {
        token: tokenHash,
        liderancaId: lideranca.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { usuario, lideranca, token };
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_LIDERANCA",
    entidade: "lideranca",
    entidadeId: result.lideranca.id,
    detalhes: { nome, email, cpf: cpfClean, tipo },
  });

  const baseUrl = getBaseUrl(req);

  return created({
    id: result.lideranca.id,
    usuarioId: result.usuario.id,
    nome,
    email: email.toLowerCase().trim(),
    cpf: cpfClean,
    tipo: result.lideranca.tipo,
    link: `${baseUrl}/acesso/${result.token}`,
  });
}
```

#### GET /api/v1/gestor-pf/liderancas
**Arquivo:** `route.ts` (mesmo diretório)

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireGestorPFWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { gestorPfId };

  if (tipo) {
    where.tipo = tipo;
  }

  if (status) {
    where.status = status;
  }

  const liderancas = await prisma.lideranca.findMany({
    where,
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
      _count: {
        select: {
          comerciais: true,
          gestores: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    liderancas.map((l) => ({
      id: l.id,
      nome: l.nome,
      email: l.usuario.email,
      cpf: l.cpf,
      tipo: l.tipo,
      status: l.status,
      totalComerciais: l._count.comerciais,
      totalGestores: l._count.gestores,
      createdAt: l.createdAt,
    })),
  );
}
```

### 2.2 Criar endpoints de Comerciais (via Liderança)

**Diretório:** `apps/web/app/api/v1/lideranca/comerciais/`

### 2.3 Criar endpoints de Gestores (via Liderança)

**Diretório:** `apps/web/app/api/v1/lideranca/gestores/`

### 2.4 Criar endpoints de Parceiros (via Comercial/Gestor)

**Diretórios:**
- `apps/web/app/api/v1/comercial/parceiros/`
- `apps/web/app/api/v1/gestor/parceiros/`

---

## FASE 3: Autenticação

### 3.1 Atualizar `apps/web/lib/auth.ts`

Adicionar no include do usuario:
```typescript
include: {
  consultor: true,
  gestorPf: true,
  parceiro: true,
  comercial: true,
  lideranca: true,  // NOVO
  gestor: true,     // NOVO
}
```

Adicionar no return:
```typescript
return {
  id: user.id,
  name: user.nome,
  email: user.email,
  tipo: user.tipo as TipoAcesso,
  papel: user.papel,
  consultorId: user.consultor?.id ?? null,
  estabelecimentoId: null,
  gestorPfId: user.gestorPf?.id ?? null,
  parceiroId: user.parceiro?.id ?? null,
  comercialId: user.comercial?.id ?? null,
  liderancaId: user.lideranca?.id ?? null,  // NOVO
  gestorId: user.gestor?.id ?? null,        // NOVO
};
```

### 3.2 Criar middlewares em `apps/web/lib/api-helpers.ts`

```typescript
export async function requireLiderancaWithScope(expectedTipo?: TipoLideranca) {
  const session = await auth();
  if (!session?.user?.liderancaId) {
    return forbidden("Acesso restrito a Liderança");
  }
  
  const lideranca = await prisma.lideranca.findUnique({
    where: { id: session.user.liderancaId },
    include: { gestorPf: true },
  });
  
  if (!lideranca) {
    return forbidden("Liderança não encontrada");
  }
  
  if (expectedTipo && lideranca.tipo !== expectedTipo) {
    return forbidden(`Acesso restrito a Liderança tipo ${expectedTipo}`);
  }
  
  return { session, lideranca, gestorPfId: lideranca.gestorPfId };
}

export async function requireComercialWithScope() {
  const session = await auth();
  if (!session?.user?.comercialId) {
    return forbidden("Acesso restrito a Comercial");
  }
  
  const comercial = await prisma.comercial.findUnique({
    where: { id: session.user.comercialId },
    include: { lideranca: { include: { gestorPf: true } } },
  });
  
  if (!comercial) {
    return forbidden("Comercial não encontrado");
  }
  
  return { session, comercial, liderancaId: comercial.liderancaId, gestorPfId: comercial.lideranca.gestorPfId };
}

export async function requireGestorWithScope() {
  const session = await auth();
  if (!session?.user?.gestorId) {
    return forbidden("Acesso restrito a Gestor");
  }
  
  const gestor = await prisma.gestor.findUnique({
    where: { id: session.user.gestorId },
    include: { lideranca: { include: { gestorPf: true } } },
  });
  
  if (!gestor) {
    return forbidden("Gestor não encontrado");
  }
  
  return { session, gestor, liderancaId: gestor.liderancaId, gestorPfId: gestor.lideranca.gestorPfId };
}
```

---

## FASE 4: Upload de Planilha

### 4.1 Atualizar `apps/web/app/api/v1/gestor-pf/uploads/service.ts`

Na função `processRow()`, atualizar a lógica de match:

```typescript
if (usuarioDaConta) {
  // 1. Buscar Comercial (match por nome)
  const comercial = await prisma.comercial.findFirst({
    where: {
      lideranca: { gestorPfId },
      nome: { contains: usuarioDaConta, mode: "insensitive" }
    },
    select: { id: true },
  });
  
  if (comercial) {
    comercialId = comercial.id;
  } else {
    // 2. Buscar Gestor (nível inferior, match por nome)
    const gestor = await prisma.gestor.findFirst({
      where: {
        lideranca: { gestorPfId },
        nome: { contains: usuarioDaConta, mode: "insensitive" }
      },
      select: { id: true },
    });
    
    if (gestor) {
      gestorId = gestor.id;
    }
  }
}
```

### 4.2 Atualizar `apps/web/app/api/v1/gestor-pf/uploads/preview/route.ts`

Mesma lógica de match no preview.

---

## FASE 5: Frontend

### 5.1 Dashboard Gestor-PF - Lideranças

**Diretório:** `apps/web/app/(dashboard)/gestor-pf/configuracoes/liderancas/`

### 5.2 Dashboard Liderança

**Diretório:** `apps/web/app/(dashboard)/lideranca/`

### 5.3 Dashboard Comercial

**Diretório:** `apps/web/app/(dashboard)/comercial/`

### 5.4 Dashboard Gestor

**Diretório:** `apps/web/app/(dashboard)/gestor/`

---

## FASE 6: Testes

### 6.1 Testes Unitários

Criar testes em `apps/web/app/__tests__/`:
- `lideranca.test.ts`
- `gestor-nivel-inferior.test.ts`
- `upload-com-lideranca.test.ts`

### 6.2 Testes de Integração

Testar hierarquia completa e permissões.

---

## COMANDOS FINAIS

### Aplicar migration:
```bash
cd packages/database
npx prisma migrate deploy
```

### Gerar Prisma Client:
```bash
npx prisma generate
```

### Rodar testes:
```bash
npm test
```