import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  notFound,
  ok,
  forbidden,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { criarParceiroSchema, atualizarParceiroSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const parceiros = await prisma.parceiro.findMany({
    where: { gestorPfId },
    include: {
      usuario: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
      indicacoes: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { indicacoes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = parceiros.map((p) => ({
    id: p.id,
    nome: p.nome,
    cpf: p.cpf,
    email: p.usuario.email,
    pixChave: p.pixChave,
    percentualComissao: p.percentualComissao,
    status: p.status,
    totalIndicados: p._count.indicacoes,
    desligadoEm: p.desligadoEm,
    createdAt: p.createdAt,
    indicacoes: p.indicacoes.map((i) => ({
      id: i.id,
      nome: i.nome,
      cpf: i.cpf,
      telefone: i.telefone,
      status: i.status,
      createdAt: i.createdAt,
    })),
  }));

  return ok(result);
}

export async function POST(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = criarParceiroSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(
      parsed.error.errors.map((e) => e.message).join(", ")
    );
  }

  const {
    nome,
    email,
    cpf,
    pixChave,
    telefone,
    percentualComissao,
  } = parsed.data;

  const cpfClean = cpf.replace(/\D/g, "");
  const percentualComissaoNum =
    percentualComissao !== undefined
      ? typeof percentualComissao === "string"
        ? parseFloat(percentualComissao)
        : percentualComissao
      : undefined;

  const existsUsuario = await prisma.usuario.findUnique({
    where: { email },
  });
  if (existsUsuario) {
    return badRequest("Email já cadastrado no sistema");
  }

  const existsCpf = await prisma.parceiro.findUnique({
    where: { cpf: cpfClean },
  });
  if (existsCpf) {
    return badRequest("CPF já cadastrado");
  }

  const gestorPf = await prisma.gestorPF.findUnique({
    where: { id: gestorPfId },
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
        email,
        senhaHash,
        tipo: "PARCEIRO",
        telefone,
        senhaTemporaria: true,
      },
    });

    const parceiro = await tx.parceiro.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: cpfClean,
        pixChave,
        percentualComissao:
          percentualComissaoNum ?? gestorPf.percentualComissaoDefault,
        status: "ATIVO",
        gestorPfId,
      },
    });

    await tx.primeiraAcss.create({
      data: {
        token: tokenHash,
        parceiroId: parceiro.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { usuario, parceiro, token };
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_PARCEIRO",
    entidade: "parceiro",
    entidadeId: result.parceiro.id,
    detalhes: { nome, email, cpf: cpfClean },
  });

  const baseUrl = getBaseUrl(req);

  return created({
    id: result.parceiro.id,
    usuarioId: result.usuario.id,
    nome,
    email,
    cpf: cpfClean,
    link: `${baseUrl}/acesso/${result.token}`,
  });
}

export async function PUT(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = atualizarParceiroSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(
      parsed.error.errors.map((e) => e.message).join(", ")
    );
  }

  const { id, ...parsedData } = parsed.data;

  if (!id) {
    return badRequest("ID do parceiro é obrigatório");
  }

  const dataToUpdate: any = { ...parsedData };
  if (dataToUpdate.percentualComissao !== undefined) {
    dataToUpdate.percentualComissao =
      typeof dataToUpdate.percentualComissao === "string"
        ? parseFloat(dataToUpdate.percentualComissao)
        : dataToUpdate.percentualComissao;
  }

  const parceiro = await prisma.parceiro.findFirst({
    where: { id, gestorPfId },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  const updated = await prisma.parceiro.update({
    where: { id },
    data: dataToUpdate,
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_PARCEIRO",
    entidade: "parceiro",
    entidadeId: id,
    detalhes: dataToUpdate,
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return badRequest("ID do parceiro é obrigatório");
  }

  const parceiro = await prisma.parceiro.findFirst({
    where: { id, gestorPfId },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  await prisma.$transaction(async (tx) => {
    await tx.indicado.updateMany({
      where: { parceiroId: id, status: "ATIVO" },
      data: { status: "DESVINCULADO", desvinculadoEm: new Date() },
    });

    await tx.parceiro.update({
      where: { id },
      data: { status: "DESLIGADO", desligadoEm: new Date() },
    });
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "DESLIGAR_PARCEIRO",
    entidade: "parceiro",
    entidadeId: id,
    detalhes: { motivo: "Desligado pelo Gestor PF" },
  });

  return ok({ message: "Parceiro desligado com sucesso" });
}