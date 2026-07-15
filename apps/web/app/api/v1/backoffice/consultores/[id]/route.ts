import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { requireBackofficeWithScope, ok, badRequest, notFound } from "@/lib/api-helpers";
import { atualizarConsultorSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
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
      estabelecimentos: {
        select: { id: true, nomeFantasia: true },
      },
    },
  });

  if (!consultor) return notFound("Consultor não encontrado");

  return ok(consultor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
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

  await prisma.$transaction(async (tx) => {
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