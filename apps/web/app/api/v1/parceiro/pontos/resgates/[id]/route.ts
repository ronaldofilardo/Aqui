import { NextRequest } from "next/server";
import {
  requireParceiroWithScope,
  badRequest,
  ok,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const CancelarResgateSchema = z.object({
  acao: z.enum(["CANCELAR"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    const resgateId = params.id;
    const body = await req.json();
    const validation = CancelarResgateSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    // Buscar resgate
    const resgate = await prisma.solicitacaoResgate.findUnique({
      where: { id: resgateId },
    });

    if (!resgate) {
      return badRequest("Resgate não encontrado");
    }

    // Verificar permissão
    if (resgate.parceiroId !== parceiroId) {
      return forbidden();
    }

    // Validar que pode ser cancelado
    if (!["SOLICITADO", "EM_ANALISE"].includes(resgate.status)) {
      return badRequest(
        `Não é possível cancelar uma solicitação com status ${resgate.status}`,
      );
    }

    // Cancelar e estornar pontos em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualizar status do resgate
      const resgateCancelado = await tx.solicitacaoResgate.update({
        where: { id: resgateId },
        data: {
          status: "CANCELADO",
          canceladoEm: new Date(),
        },
      });

      // Criar movimentação de estorno
      await tx.movimentacaoPontos.create({
        data: {
          parceiroId,
          cicloPontosId: resgate.cicloPontosId,
          tipo: "ESTORNO",
          origem: "ESTORNO_RESGATE",
          quantidade: resgate.pontosDebitados,
          referenciaSolicitacaoResgateId: resgateId,
          observacao: "Estorno: cancelamento de resgate pelo parceiro",
        },
      });

      return resgateCancelado;
    });

    return ok({
      id: resultado.id,
      status: resultado.status,
      canceladoEm: resultado.canceladoEm?.toISOString(),
      pontosDevolvidosAoSaldo: resgate.pontosDebitados,
      mensagem: "Solicitação cancelada e pontos devolvidos ao saldo",
    });
  } catch (err) {
    console.error("Erro ao cancelar resgate:", err);
    return badRequest("Erro ao cancelar resgate");
  }
}
