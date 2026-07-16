import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  getSession,
  notFound,
  ok,
  forbidden,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarParceiroSchema, atualizarParceiroSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  // Buscar todas as lideranças deste Gestor PF
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    include: {
      comerciais: { select: { id: true } },
      gestores: { select: { id: true } },
    },
  });

  // Coletar todos os IDs de comerciais e gestores
  const comercialIds = liderancas.flatMap(l => l.comerciais.map(c => c.id));
  const gestorIds = liderancas.flatMap(l => l.gestores.map(g => g.id));

  // Buscar TODOS os parceiros: vinculados a comerciais/gestores OU sem vínculo (órfãos)
  const parceiros = await prisma.parceiro.findMany({
    where: {
      OR: [
        { comercialId: { in: comercialIds } },
        { gestorId: { in: gestorIds } },
        { comercialId: null, gestorId: null }, // Parceiros órfãos
      ],
    },
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
    periodicidadeCicloEscolhida: p.periodicidadeCicloEscolhida,
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
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const validation = criarParceiroSchema.safeParse(body);
  if (!validation.success) {
    return badRequest(validation.error.errors[0].message);
  }

  const { nome, email, cpf, pixChave } = validation.data;

  const cpfUnmasked = cpf.replace(/\D/g, "");

  const existingParceiro = await prisma.parceiro.findFirst({
    where: { cpf: cpfUnmasked },
  });

  if (existingParceiro) {
    return badRequest("CPF já cadastrado");
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existingUser) {
    return badRequest("E-mail já cadastrado");
  }

  const passwordHash = await hash("123456", 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: passwordHash,
      tipo: "PARCEIRO",
    },
  });

  const parceiro = await prisma.parceiro.create({
    data: {
      nome,
      cpf: cpfUnmasked,
      pixChave: pixChave || null,
      usuarioId: usuario.id,
      status: "ATIVO",
    },
  });

  const resetToken = await generateResetToken(usuario.id);
  const resetLink = `${getBaseUrl()}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  await criarAuditLog({
    usuarioId: session.usuarioId,
    acao: "CRIAR",
    entidade: "PARCEIRO",
    entidadeId: parceiro.id,
    descricao: `Parceiro ${nome} criado`,
  });

  return created({ link: resetLink });
}

export async function PUT(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const validation = atualizarParceiroSchema.safeParse(body);
  if (!validation.success) {
    return badRequest(validation.error.errors[0].message);
  }

  const { id, nome, email, cpf, pixChave } = validation.data;

  const cpfUnmasked = cpf.replace(/\D/g, "");

  const parceiro = await prisma.parceiro.findUnique({
    where: { id },
    include: { usuario: true },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  const existingParceiro = await prisma.parceiro.findFirst({
    where: {
      cpf: cpfUnmasked,
      id: { not: id },
    },
  });

  if (existingParceiro) {
    return badRequest("CPF já cadastrado");
  }

  const existingUser = await prisma.usuario.findFirst({
    where: {
      email,
      id: { not: parceiro.usuarioId },
    },
  });

  if (existingUser) {
    return badRequest("E-mail já cadastrado");
  }

  await prisma.usuario.update({
    where: { id: parceiro.usuarioId },
    data: { email },
  });

  await prisma.parceiro.update({
    where: { id },
    data: {
      nome,
      cpf: cpfUnmasked,
      pixChave: pixChave || null,
    },
  });

  await criarAuditLog({
    usuarioId: session.usuarioId,
    acao: "ATUALIZAR",
    entidade: "PARCEIRO",
    entidadeId: id,
    descricao: `Parceiro ${nome} atualizado`,
  });

  return ok({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return badRequest("ID do parceiro não informado");
  }

  const parceiro = await prisma.parceiro.findUnique({
    where: { id },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  await prisma.parceiro.update({
    where: { id },
    data: {
      status: "DESATIVADO",
      desligadoEm: new Date(),
    },
  });

  await prisma.usuario.update({
    where: { id: parceiro.usuarioId },
    data: { status: "INATIVO" },
  });

  await criarAuditLog({
    usuarioId: session.usuarioId,
    acao: "DESATIVAR",
    entidade: "PARCEIRO",
    entidadeId: id,
    descricao: `Parceiro ${parceiro.nome} desativado`,
  });

  return ok({ success: true });
}

