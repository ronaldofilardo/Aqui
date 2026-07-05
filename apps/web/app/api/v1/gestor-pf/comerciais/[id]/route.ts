import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  notFound,
  ok,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { atualizarComercialSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id, gestorPfId },
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
    },
  });
  if (!comercial) return notFound("Comercial não encontrado");

  return ok({
    id: comercial.id,
    nome: comercial.nome,
    cpf: comercial.cpf,
    email: comercial.usuario.email,
    percentualComissao: comercial.percentualComissao,
    status: comercial.status,
    createdAt: comercial.createdAt,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = atualizarComercialSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id, gestorPfId },
  });
  if (!comercial) return notFound("Comercial não encontrado");

  const dataToUpdate: any = { ...parsed.data };
  if (dataToUpdate.percentualComissao !== undefined) {
    dataToUpdate.percentualComissao =
      typeof dataToUpdate.percentualComissao === "string"
        ? parseFloat(dataToUpdate.percentualComissao)
        : dataToUpdate.percentualComissao;
  }

  const updated = await prisma.comercial.update({
    where: { id: params.id },
    data: dataToUpdate,
  });

  if (dataToUpdate.nome) {
    await prisma.usuario.update({
      where: { id: comercial.usuarioId },
      data: { nome: dataToUpdate.nome },
    });
  }

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_COMERCIAL",
    entidade: "comercial",
    entidadeId: params.id,
    detalhes: dataToUpdate,
  });

  return ok(updated);
}
