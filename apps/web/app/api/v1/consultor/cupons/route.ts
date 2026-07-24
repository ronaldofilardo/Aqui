import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { requireAuth, ok, created, badRequest } from "@/lib/api-helpers";
import { criarCupomConfigSchema } from "@aqui/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const where = session!.user.tipo === "CONSULTOR"
    ? { estabelecimento: { consultorId: session!.user.consultorId! } }
    : {};

  const cupons = await prisma.cupomConfig.findMany({
    where,
    include: {
      estabelecimento: { select: { id: true, nomeFantasia: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok(cupons);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = criarCupomConfigSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { estabelecimentoId, codigoCupom, descricao } = parsed.data;

  // Verify ownership for consultors
  if (session!.user.tipo === "CONSULTOR") {
    const estab = await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
    });
    if (!estab || estab.consultorId !== session!.user.consultorId) {
      return badRequest("Estabelecimento não encontrado ou não pertence a você");
    }
  }

  // Check if cupom code is unique
  const existing = await prisma.cupomConfig.findUnique({
    where: { codigoCupom },
  });
  if (existing) {
    return badRequest("Código de cupom já está em uso");
  }

  // Check if estabelecimento already has a cupom
  const existingEstab = await prisma.cupomConfig.findUnique({
    where: { estabelecimentoId },
  });
  if (existingEstab) {
    return badRequest("Estabelecimento já possui um cupom atribuído");
  }

  const cupom = await prisma.cupomConfig.create({
    data: {
      estabelecimentoId,
      codigoCupom,
      descricao,
      criadoPor: session!.user.id,
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_CUPOM_CONFIG",
    entidade: "cupom_config",
    entidadeId: cupom.id,
    detalhes: { codigoCupom, estabelecimentoId },
  });

  return created(cupom);
}
