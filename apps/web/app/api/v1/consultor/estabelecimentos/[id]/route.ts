import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { requireConsultor, ok, badRequest, notFound, forbidden } from "@/lib/api-helpers";
import { atualizarEstabelecimentoSchema } from "@aqui/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const { id } = await params;
  const estab = await prisma.estabelecimento.findUnique({
    where: { id },
    include: { cupomConfig: true, documentos: true },
  });

  if (!estab) return notFound("Estabelecimento não encontrado");
  if (estab.consultorId !== session!.user.consultorId) return forbidden();

  return ok(estab);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = atualizarEstabelecimentoSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const estab = await prisma.estabelecimento.findUnique({ where: { id } });
  if (!estab) return notFound("Estabelecimento não encontrado");
  if (estab.consultorId !== session!.user.consultorId) return forbidden();

  const updated = await prisma.estabelecimento.update({
    where: { id },
    data: parsed.data,
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_ESTABELECIMENTO",
    entidade: "estabelecimento",
    entidadeId: id,
    detalhes: parsed.data,
  });

  return ok(updated);
}
