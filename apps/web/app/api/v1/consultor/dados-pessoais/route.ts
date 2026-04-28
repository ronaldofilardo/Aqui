import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { requireConsultor, ok, badRequest } from "@/lib/api-helpers";
import { atualizarConsultorSelfSchema } from "@asa/shared";

export async function GET() {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const consultor = await prisma.consultor.findUnique({
    where: { usuarioId: session!.user.id },
    include: {
      usuario: { select: { nome: true, email: true, telefone: true } },
    },
  });

  if (!consultor) {
    return badRequest("Consultor não encontrado");
  }

  return ok({
    usuario: consultor.usuario,
    pixChave: consultor.pixChave,
    pixTipo: consultor.pixTipo,
    bancoNome: consultor.bancoNome,
    agencia: consultor.agencia,
    conta: consultor.conta,
  });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const body = await req.json();
  const parsed = atualizarConsultorSelfSchema.safeParse(body);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return badRequest(JSON.stringify(errors));
  }

  const { nome, telefone, pixChave, pixTipo, bancoNome, agencia, conta } =
    parsed.data;

  try {
    // Atualizar usuário
    if (nome || telefone !== undefined) {
      await prisma.usuario.update({
        where: { id: session!.user.id },
        data: {
          ...(nome && { nome }),
          ...(telefone !== undefined && { telefone: telefone || null }),
        },
      });
    }

    // Atualizar consultor
    await prisma.consultor.update({
      where: { usuarioId: session!.user.id },
      data: {
        pixChave: pixChave || null,
        pixTipo: pixTipo || null,
        bancoNome: bancoNome || null,
        agencia: agencia || null,
        conta: conta || null,
      },
    });

    return ok({ message: "Dados atualizados com sucesso" });
  } catch (err) {
    console.error("[dados-pessoais] erro ao atualizar:", err);
    return NextResponse.json(
      { error: "Erro interno ao atualizar dados" },
      { status: 500 },
    );
  }
}
