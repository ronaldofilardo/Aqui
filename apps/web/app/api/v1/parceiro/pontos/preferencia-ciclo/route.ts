import { NextRequest } from "next/server";
import {
  badRequest,
  ok,
  requireParceiroWithScope,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const PreferenciaCicloSchema = z.object({
  periodicidade: z.enum(["SEMESTRAL", "ANUAL"]),
});

export async function PATCH(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = PreferenciaCicloSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("periodicidade deve ser SEMESTRAL ou ANUAL");
  }

  // Regra de segurança: se existir ciclo em andamento desta periodicidade
  // já com movimentações do parceiro, bloquear troca (regra sugerida do plano,
  // aguardando confirmação do negócio).
  const parceiro = await prisma.parceiro.findUnique({
    where: { id: parceiroId },
    select: {
      periodicidadeCicloEscolhida: true,
      _count: {
        select: { movimentacoesPontos: true },
      },
    },
  });

  if (!parceiro) {
    return badRequest("Parceiro não encontrado");
  }

  // Só bloqueia se já existirem movimentações de pontos (evita troca só na configuração inicial).
  if (parceiro._count.movimentacoesPontos > 0) {
    return badRequest(
      "Não é possível alterar a periodicidade após o início do acúmulo de pontos. Aguarde o encerramento do ciclo atual da periodicidade escolhida.",
    );
  }

  await prisma.parceiro.update({
    where: { id: parceiroId },
    data: {
      periodicidadeCicloEscolhida: parsed.data.periodicidade,
    },
  });

  return ok({
    periodicidade: parsed.data.periodicidade,
    mensagem: "Preferência de ciclo atualizada com sucesso",
  });
}

export async function GET() {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: parceiroId },
    select: {
      periodicidadeCicloEscolhida: true,
    },
  });

  return ok({
    periodicidade: parceiro?.periodicidadeCicloEscolhida ?? null,
  });
}
