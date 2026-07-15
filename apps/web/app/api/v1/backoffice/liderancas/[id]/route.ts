import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const lideranca = await prisma.lideranca.findUnique({
    where: { id: params.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
      comerciais: {
        include: {
          usuario: {
            select: { email: true },
          },
          _count: {
            select: { parceiros: true },
          },
        },
      },
      gestores: {
        include: {
          usuario: {
            select: { email: true },
          },
          _count: {
            select: { parceiros: true },
          },
        },
      },
      backoffice: {
        select: { id: true, nome: true },
      },
    },
  });

  if (!lideranca) {
    return notFound("Liderança não encontrada");
  }

  if (lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  return ok({
    id: lideranca.id,
    nome: lideranca.nome,
    email: lideranca.usuario.email,
    cpf: lideranca.cpf,
    tipo: lideranca.tipo,
    status: lideranca.status,
    createdAt: lideranca.createdAt,
    backoffice: lideranca.backoffice,
    equipe: {
      comerciais: lideranca.comerciais.map((c) => ({
        id: c.id,
        nome: c.nome,
        email: c.usuario.email,
        cpf: c.cpf,
        funcao: c.funcao,
        totalParceiros: c._count.parceiros,
        createdAt: c.createdAt,
      })),
      gestores: lideranca.gestores.map((g) => ({
        id: g.id,
        nome: g.nome,
        email: g.usuario.email,
        cpf: g.cpf,
        totalParceiros: g._count.parceiros,
        createdAt: g.createdAt,
      })),
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const { status } = z
    .object({
      status: z.enum(["ATIVO", "INATIVO"]).optional(),
    })
    .parse(body);

  const lideranca = await prisma.lideranca.findUnique({
    where: { id: params.id },
  });

  if (!lideranca) {
    return notFound("Liderança não encontrada");
  }

  if (lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  const updated = await prisma.lideranca.update({
    where: { id: params.id },
    data: { status },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_LIDERANCA",
    entidade: "lideranca",
    entidadeId: params.id,
    detalhes: { status },
  });

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const lideranca = await prisma.lideranca.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          comerciais: true,
          gestores: true,
        },
      },
    },
  });

  if (!lideranca) {
    return notFound("Liderança não encontrada");
  }

  if (lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  if (lideranca._count.comerciais > 0 || lideranca._count.gestores > 0) {
    return badRequest(
      "Não é possível excluir liderança com equipe vinculada. Transfira os membros primeiro.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.lideranca.update({
      where: { id: params.id },
      data: { status: "INATIVO" },
    });
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "DESATIVAR_LIDERANCA",
    entidade: "lideranca",
    entidadeId: params.id,
    detalhes: { motivo: "Desativado pelo backoffice" },
  });

  return ok({ message: "Liderança desativada com sucesso" });
}
