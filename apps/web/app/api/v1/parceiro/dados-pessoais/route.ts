import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, notFound, requireParceiroWithScope, badRequest } from "@/lib/api-helpers";
import { atualizarConsultorSelfSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: parceiroId },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
        },
      },
    },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  return ok({
    id: parceiro.id,
    nome: parceiro.nome,
    cpf: parceiro.cpf,
    email: parceiro.usuario.email,
    telefone: parceiro.usuario.telefone,
    pixChave: parceiro.pixChave,
    status: parceiro.status,
  });
}

export async function PUT(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = atualizarConsultorSelfSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(
      parsed.error.errors.map((e) => e.message).join(", ")
    );
  }

  const { nome, telefone, pixChave } = parsed.data;

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: parceiroId },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  const dataToUpdate: any = {};
  if (nome !== undefined) dataToUpdate.nome = nome;
  if (telefone !== undefined) dataToUpdate.usuario = { telefone };
  if (pixChave !== undefined) dataToUpdate.pixChave = pixChave;

  await prisma.$transaction(async (tx) => {
    await tx.parceiro.update({
      where: { id: parceiroId },
      data: dataToUpdate,
    });

    if (nome) {
      await tx.usuario.update({
        where: { id: parceiro.usuarioId },
        data: { nome },
      });
    }
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_PARCEIRO_SELF",
    entidade: "parceiro",
    entidadeId: parceiroId,
    detalhes: { nome, telefone, pixChave },
  });

  return ok({ message: "Dados atualizados com sucesso" });
}