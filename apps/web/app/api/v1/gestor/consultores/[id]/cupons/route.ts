import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  requireGestor,
  ok,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/api-helpers";
import { z } from "zod";

const createCupomSchema = z.object({
  estabelecimentoId: z.string().uuid("ID de estabelecimento inválido"),
  codigoCupom: z
    .string()
    .min(1, "Código do cupom é obrigatório")
    .max(50, "Código do cupom deve ter no máximo 50 caracteres")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Código deve conter apenas letras, números, _ ou -",
    ),
  descricao: z.string().max(255).optional(),
});

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
      usuario: { select: { id: true, nome: true, email: true } },
      estabelecimentos: {
        where: { status: "ATIVO" },
        orderBy: { nomeFantasia: "asc" },
        include: {
          cupomConfig: {
            select: {
              id: true,
              codigoCupom: true,
              descricao: true,
              status: true,
              criadoEm: true,
              _count: { select: { cuponsImportados: true } },
            },
          },
        },
      },
    },
  });

  if (!consultor) return notFound("Consultor não encontrado");

  return ok({
    consultor: {
      id: consultor.id,
      nome: consultor.usuario.nome,
      email: consultor.usuario.email,
    },
    estabelecimentos: consultor.estabelecimentos.map(
      (e: (typeof consultor.estabelecimentos)[0]) => ({
        id: e.id,
        nomeFantasia: e.nomeFantasia,
        cidade: e.cidade,
        estado: e.estado,
        cupomConfig: e.cupomConfig,
      }),
    ),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireGestor();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createCupomSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { estabelecimentoId, codigoCupom, descricao } = parsed.data;
  const { id } = await params;

  // Verify gestor has scope over this consultor
  const gestorConsultor = await prisma.gestorConsultor.findFirst({
    where: { gestorId: session!.user.id, consultorId: id },
  });
  if (!gestorConsultor) return forbidden();

  // Verify the estabelecimento belongs to this consultor
  const estabelecimento = await prisma.estabelecimento.findFirst({
    where: { id: estabelecimentoId, consultorId: id },
  });
  if (!estabelecimento) {
    return notFound("Estabelecimento não encontrado para este consultor");
  }

  // Check if code is already in use by ANOTHER estabelecimento
  const codeInUse = await prisma.cupomConfig.findUnique({
    where: { codigoCupom },
    include: { estabelecimento: { select: { nomeFantasia: true } } },
  });
  if (codeInUse && codeInUse.estabelecimentoId !== estabelecimentoId) {
    return badRequest(
      `Código '${codigoCupom}' já está cadastrado para outro estabelecimento (${codeInUse.estabelecimento.nomeFantasia}). Use um código diferente.`,
    );
  }

  // Upsert: create or update the cupom config for this estabelecimento
  const cupomConfig = await prisma.cupomConfig.upsert({
    where: { estabelecimentoId },
    create: {
      estabelecimentoId,
      codigoCupom,
      descricao: descricao ?? null,
      criadoPor: session!.user.id,
    },
    update: {
      codigoCupom,
      descricao: descricao ?? null,
    },
  });

  return ok({ cupomConfig });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireGestor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const cupomConfigId = searchParams.get("cupomConfigId");
  if (!cupomConfigId) return badRequest("cupomConfigId é obrigatório");

  const { id } = await params;

  // Verify ownership chain: cupomConfig → estabelecimento → consultor
  const cupomConfig = await prisma.cupomConfig.findFirst({
    where: {
      id: cupomConfigId,
      estabelecimento: { consultorId: id },
    },
    include: { _count: { select: { cuponsImportados: true } } },
  });

  if (!cupomConfig) return notFound("Código de cupom não encontrado");

  if (cupomConfig._count.cuponsImportados > 0) {
    return badRequest(
      "Não é possível remover: existem cupons importados com este código",
    );
  }

  // Soft delete: inativar ao invés de deletar
  await prisma.cupomConfig.update({ where: { id: cupomConfigId }, data: { status: "INATIVO" } });

  return ok({ mensagem: "Código de cupom removido com sucesso" });
}
