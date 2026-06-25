import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, created, ok, notFound, requireParceiroWithScope } from "@/lib/api-helpers";
import { cadastrarIndicadoSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ATIVO";

  const indicados = await prisma.indicado.findMany({
    where: {
      parceiroId,
      status: status as "ATIVO" | "DESVINCULADO",
    },
    include: {
      _count: { select: { procedimentos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = indicados.map((i) => ({
    id: i.id,
    nome: i.nome,
    cpf: i.cpf,
    telefone: i.telefone,
    status: i.status,
    totalProcedimentos: i._count.procedimentos,
    createdAt: i.createdAt,
    desvinculadoEm: i.desvinculadoEm,
  }));

  return ok(result);
}

export async function POST(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = cadastrarIndicadoSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(
      parsed.error.errors.map((e) => e.message).join(", ")
    );
  }

  const { nome, cpf, telefone } = parsed.data;

  const cpfClean = cpf.replace(/\D/g, "");

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: parceiroId },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  if (parceiro.status === "DESLIGADO") {
    return badRequest("Parceiro desligado não pode cadastrar novos indicados");
  }

  const existente = await prisma.indicado.findUnique({
    where: { cpf: cpfClean },
  });

  if (existente) {
    return badRequest(
      "Este CPF já está vinculado a um parceiro. Cada cliente pode ser indicado por apenas um parceiro."
    );
  }

  const resultado = await prisma.indicado.create({
    data: {
      nome,
      cpf: cpfClean,
      telefone: telefone || null,
      parceiroId,
      status: "ATIVO",
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CADASTRAR_INDICADO",
    entidade: "indicado",
    entidadeId: resultado.id,
    detalhes: { nome, cpf: cpfClean },
  });

  return created({
    id: resultado.id,
    nome: resultado.nome,
    cpf: resultado.cpf,
    telefone: resultado.telefone,
    status: resultado.status,
    createdAt: resultado.createdAt,
  });
}

export async function DELETE(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return badRequest("ID do indicado é obrigatório");
  }

  const indicado = await prisma.indicado.findFirst({
    where: { id, parceiroId },
  });

  if (!indicado) {
    return notFound("Indicado não encontrado");
  }

  await prisma.indicado.update({
    where: { id },
    data: { status: "DESVINCULADO", desvinculadoEm: new Date() },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "DESVINCULAR_INDICADO",
    entidade: "indicado",
    entidadeId: id,
    detalhes: { motivo: "Desvinculado pelo Parceiro" },
  });

  return ok({ message: "Indicado desvinculado com sucesso" });
}