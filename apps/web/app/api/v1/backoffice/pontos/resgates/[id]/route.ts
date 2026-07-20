import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const UpdateResgateSchema = z.object({
  novoStatus: z.enum(["EM_ANALISE", "APROVADO", "REJEITADO", "ENTREGUE"]),
  observacao: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const resgateId = params.id;
    const body = await req.json();
    const validation = UpdateResgateSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { novoStatus, observacao } = validation.data;

    // Buscar resgate
    const resgate = await prisma.solicitacaoResgate.findUnique({
      where: { id: resgateId },
      include: {
        cicloPontos: true,
      },
    });

    if (!resgate) {
      return forbidden();
    }

    // Verificar se o resgate pertence ao backoffice
    const ciclo = await prisma.cicloPontos.findUnique({
      where: { id: resgate.cicloPontosId },
    });

    if (!ciclo || ciclo.backofficeId !== backofficeId) {
      return forbidden();
    }

    // Validar transição de estado
    const transicoes_validas: Record<string, string[]> = {
      SOLICITADO: ["EM_ANALISE", "CANCELADO"],
      EM_ANALISE: ["APROVADO", "REJEITADO", "CANCELADO"],
      APROVADO: ["ENTREGUE"],
      REJEITADO: [],
      ENTREGUE: [],
      CANCELADO: [],
    };

    if (!transicoes_validas[resgate.status].includes(novoStatus)) {
      return badRequest(
        `Não é possível transicionar de ${resgate.status} para ${novoStatus}`,
      );
    }

    // Se rejeitando, estornar pontos
    if (novoStatus === "REJEITADO") {
      await prisma.movimentacaoPontos.create({
        data: {
          parceiroId: resgate.parceiroId,
          cicloPontosId: resgate.cicloPontosId,
          tipo: "ESTORNO",
          origem: "ESTORNO_RESGATE",
          quantidade: resgate.pontosDebitados,
          referenciaSolicitacaoResgateId: resgateId,
          observacao: `Estorno: solicitação de resgate rejeitada`,
        },
      });
    }

    // Atualizar resgate
    const updatedResgate = await prisma.solicitacaoResgate.update({
      where: { id: resgateId },
      data: {
        status: novoStatus,
        processadoPor: session?.user.id,
        processadoEm: ["EM_ANALISE", "APROVADO", "REJEITADO"].includes(
          novoStatus,
        )
          ? new Date()
          : undefined,
        entregueEm: novoStatus === "ENTREGUE" ? new Date() : undefined,
        observacao: observacao || resgate.observacao,
      },
      include: {
        parceiro: {
          select: { nome: true, cpf: true },
        },
        premio: {
          select: { codigo: true, descricao: true },
        },
      },
    });

return ok({
      id: updatedResgate.id,
      status: updatedResgate.status,
      parceiro: updatedResgate.parceiro,
      premio: updatedResgate.premio,
      processadoEm: updatedResgate.processadoEm?.toISOString(),
      entregueEm: updatedResgate.entregueEm?.toISOString(),
      mensagem: `Resgate atualizado para ${novoStatus}`,
    });
  } catch (err) {
    console.error("Erro ao atualizar resgate:", err);
    return badRequest("Erro ao atualizar resgate");
  }
}
