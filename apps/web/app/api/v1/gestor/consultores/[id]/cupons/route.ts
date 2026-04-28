import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest, notFound } from "@/lib/api-helpers";
import { z } from "zod";

const createCupomSchema = z.object({
  estabelecimentoId: z.string().uuid("ID de estabelecimento inválido"),
  codigoCupom: z
    .string()
    .min(1, "Código do cupom é obrigatório")
    .max(50, "Código do cupom deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-z0-9_-]+$/, "Código deve conter apenas letras, números, _ ou -"),
  descricao: z.string().max(255).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireGestor();
  if (error) return error;

  const consultor = await prisma.consultor.findUnique({
    where: { id: params.id },
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
    estabelecimentos: (consultor.estabelecimentos as any[]).map((e: any) => ({
      id: e.id,
      nomeFantasia: e.nomeFantasia,
      cidade: e.cidade,
      estado: e.estado,
      cupomConfig: e.cupomConfig,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireGestor();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createCupomSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { estabelecimentoId, codigoCupom, descricao } = parsed.data;

  // Verify the estabelecimento belongs to this consultor
  const estabelecimento = await prisma.estabelecimento.findFirst({
    where: { id: estabelecimentoId, consultorId: params.id },
  });
  if (!estabelecimento) {
    return notFound("Estabelecimento não encontrado para este consultor");
  }

  // Check if already has a cupom config
  const existing = await prisma.cupomConfig.findUnique({
    where: { estabelecimentoId },
  });
  if (existing) {
    return badRequest("Este estabelecimento já possui um código de cupom cadastrado");
  }

  // Check unique cupom code
  const codeInUse = await prisma.cupomConfig.findUnique({
    where: { codigoCupom },
  });
  if (codeInUse) {
    return badRequest(`Código de cupom '${codigoCupom}' já está em uso`);
  }

  const cupomConfig = await prisma.cupomConfig.create({
    data: {
      estabelecimentoId,
      codigoCupom,
      descricao: descricao ?? null,
      criadoPor: session!.user.id,
    },
  });

  return ok({ cupomConfig });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireGestor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const cupomConfigId = searchParams.get("cupomConfigId");
  if (!cupomConfigId) return badRequest("cupomConfigId é obrigatório");

  // Verify ownership chain: cupomConfig → estabelecimento → consultor
  const cupomConfig = await prisma.cupomConfig.findFirst({
    where: {
      id: cupomConfigId,
      estabelecimento: { consultorId: params.id },
    },
    include: { _count: { select: { cuponsImportados: true } } },
  });

  if (!cupomConfig) return notFound("Código de cupom não encontrado");

  if (cupomConfig._count.cuponsImportados > 0) {
    return badRequest(
      "Não é possível remover: existem cupons importados com este código"
    );
  }

  await prisma.cupomConfig.delete({ where: { id: cupomConfigId } });

  return ok({ mensagem: "Código de cupom removido com sucesso" });
}
