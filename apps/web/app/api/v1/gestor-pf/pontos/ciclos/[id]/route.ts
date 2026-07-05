import { NextRequest } from "next/server";
import {
  requireGestorPFWithScope,
  badRequest,
  ok,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const UpdateCicloSchema = z.object({
  novoStatus: z.enum(["EM_ANDAMENTO", "RESGATE_ABERTO", "ENCERRADO"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, gestorPfId, error } = await requireGestorPFWithScope();
    if (error) return error;

    const cicloId = params.id;
    const body = await req.json();
    const validation = UpdateCicloSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { novoStatus } = validation.data;

    // Buscar ciclo
    const ciclo = await prisma.cicloPontos.findUnique({
      where: { id: cicloId },
    });

    if (!ciclo || ciclo.gestorPfId !== gestorPfId) {
      return forbidden();
    }

    // Validar transições de estado
    const transicoes_validas: Record<string, string[]> = {
      EM_ANDAMENTO: ["RESGATE_ABERTO"],
      RESGATE_ABERTO: ["ENCERRADO"],
      ENCERRADO: [],
    };

    if (!transicoes_validas[ciclo.status].includes(novoStatus)) {
      return badRequest(
        `Não é possível transicionar de ${ciclo.status} para ${novoStatus}`,
      );
    }

    // Se movendo para RESGATE_ABERTO, validar que fimAcumuloEm foi atingido
    if (novoStatus === "RESGATE_ABERTO" && new Date() < ciclo.fimAcumuloEm) {
      return badRequest(
        "A janela de resgate ainda não foi aberta. Aguarde até " +
          ciclo.fimAcumuloEm.toISOString(),
      );
    }

    // Se movendo para ENCERRADO, rodar expiração de pontos
    if (novoStatus === "ENCERRADO") {
      await expirarPontosDoCiclo(cicloId);
    }

    // Atualizar status
    const cicloAtualizado = await prisma.cicloPontos.update({
      where: { id: cicloId },
      data: {
        status: novoStatus,
        ...(novoStatus === "ENCERRADO" && {
          processadoExpiracaoEm: new Date(),
        }),
      },
    });

    return ok({
      id: cicloAtualizado.id,
      nome: cicloAtualizado.nome,
      status: cicloAtualizado.status,
      processadoExpiracaoEm:
        cicloAtualizado.processadoExpiracaoEm?.toISOString(),
      mensagem: `Ciclo transicionado para ${novoStatus}`,
    });
  } catch (err) {
    console.error("Erro ao atualizar ciclo:", err);
    return badRequest("Erro ao atualizar ciclo");
  }
}

/**
 * Expira pontos remanescentes do ciclo
 */
async function expirarPontosDoCiclo(cicloPontosId: string) {
  const parceiros = await prisma.parceiro.findMany();

  for (const parceiro of parceiros) {
    const saldoAtual = await calcularSaldoPontos(parceiro.id, cicloPontosId);

    if (saldoAtual > 0) {
      await prisma.movimentacaoPontos.create({
        data: {
          parceiroId: parceiro.id,
          cicloPontosId,
          tipo: "DEBITO",
          origem: "EXPIRACAO",
          quantidade: saldoAtual,
          observacao: "Pontos expirados ao fim do ciclo",
        },
      });
    }
  }
}

async function calcularSaldoPontos(
  parceiroId: string,
  cicloPontosId: string,
): Promise<number> {
  const creditos = await prisma.movimentacaoPontos.aggregate({
    _sum: { quantidade: true },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "CREDITO",
    },
  });

  const debitos = await prisma.movimentacaoPontos.aggregate({
    _sum: { quantidade: true },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "DEBITO",
    },
  });

  const estornos = await prisma.movimentacaoPontos.aggregate({
    _sum: { quantidade: true },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "ESTORNO",
    },
  });

  const c = creditos._sum.quantidade || 0;
  const d = debitos._sum.quantidade || 0;
  const e = estornos._sum.quantidade || 0;

  return c - d + e;
}
