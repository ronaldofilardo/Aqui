import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, notFound, requireGestorPFWithScope } from "@/lib/api-helpers";
import { atualizarGestorPFSchema } from "@asa/shared";
import { badRequest } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const gestorPf = await prisma.gestorPF.findUnique({
    where: { id: gestorPfId },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
    },
  });

  if (!gestorPf) {
    return notFound("Gestor PF não encontrado");
  }

  return ok({
    id: gestorPf.id,
    nome: gestorPf.nome,
    cpf: gestorPf.cpf,
    email: gestorPf.usuario.email,
    percentualComissaoDefault: gestorPf.percentualComissaoDefault,
    percentualComissaoMax: gestorPf.percentualComissaoMax,
  });
}

export async function PUT(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = atualizarGestorPFSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(
      parsed.error.errors.map((e) => e.message).join(", ")
    );
  }

  const { nome, percentualComissaoDefault, percentualComissaoMax } =
    parsed.data;

  const dataToUpdate: any = {};
  if (nome !== undefined) dataToUpdate.nome = nome;
  if (percentualComissaoDefault !== undefined)
    dataToUpdate.percentualComissaoDefault = percentualComissaoDefault;
  if (percentualComissaoMax !== undefined)
    dataToUpdate.percentualComissaoMax = percentualComissaoMax;

  if (Object.keys(dataToUpdate).length === 0) {
    return badRequest("Nenhuma alteração informada");
  }

  const updated = await prisma.gestorPF.update({
    where: { id: gestorPfId },
    data: dataToUpdate,
  });

  if (nome) {
    await prisma.usuario.update({
      where: { id: updated.usuarioId },
      data: { nome },
    });
  }

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_GESTOR_PF",
    entidade: "gestor_pf",
    entidadeId: gestorPfId,
    detalhes: dataToUpdate,
  });

  return ok(updated);
}