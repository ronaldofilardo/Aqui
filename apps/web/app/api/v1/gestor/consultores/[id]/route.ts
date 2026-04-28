import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest, notFound } from "@/lib/api-helpers";
import { atualizarConsultorSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireGestor();
  if (error) return error;

  const { id } = await params;
  const consultor = await prisma.consultor.findUnique({
    where: { id },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          status: true,
        },
      },
      estabelecimentos: { include: { cupomConfig: true } },
      _count: { select: { comissoes: true, pagamentos: true } },
    },
  });

  if (!consultor) return notFound("Consultor não encontrado");
  return ok(consultor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireGestor();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = atualizarConsultorSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const consultor = await prisma.consultor.findUnique({
    where: { id },
    include: { usuario: true },
  });
  if (!consultor) return notFound("Consultor não encontrado");

  const { status, nome, telefone, ...consultorData } = parsed.data;

  await prisma.$transaction(async (tx: any) => {
    if (status || nome || telefone) {
      await tx.usuario.update({
        where: { id: consultor.usuarioId },
        data: {
          ...(status && { status }),
          ...(nome && { nome }),
          ...(telefone !== undefined && { telefone }),
        },
      });
    }

    const hasConsultorUpdate = Object.keys(consultorData).length > 0;
    if (hasConsultorUpdate) {
      await tx.consultor.update({
        where: { id },
        data: consultorData,
      });
    }
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_CONSULTOR",
    entidade: "consultor",
    entidadeId: id,
    detalhes: parsed.data,
  });

  return ok({ success: true });
}
