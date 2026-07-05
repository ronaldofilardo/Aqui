import { NextRequest } from "next/server";
import {
  requireParceiroWithScope,
  badRequest,
  ok,
  created,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const SolicitarResgateSchema = z.object({
  premioId: z.string().uuid("ID do prêmio inválido"),
});

export async function GET(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get("cicloPontosId");

    const where: any = {
      parceiroId,
    };

    if (cicloPontosId) {
      where.cicloPontosId = cicloPontosId;
    }

    const resgates = await prisma.solicitacaoResgate.findMany({
      where,
      include: {
        premio: {
          select: {
            id: true,
            nome: true,
            custoPontos: true,
          },
        },
        cicloPontos: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { solicitadoEm: "desc" },
    });

    return ok({
      resgates: resgates.map((r) => ({
        id: r.id,
        premio: r.premio,
        cicloPontos: r.cicloPontos,
        pontosDebitados: r.pontosDebitados,
        status: r.status,
        solicitadoEm: r.solicitadoEm.toISOString(),
        entregueEm: r.entregueEm?.toISOString(),
        canceladoEm: r.canceladoEm?.toISOString(),
        observacao: r.observacao,
        podesCancelar: ["SOLICITADO", "EM_ANALISE"].includes(r.status),
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar resgates:", err);
    return badRequest("Erro ao buscar resgates");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    const body = await req.json();
    const validation = SolicitarResgateSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { premioId } = validation.data;

    // Buscar prêmio
    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio || !premio.ativo) {
      return badRequest("Prêmio não encontrado ou indisponível");
    }

    // Buscar ciclo vigente do gestor do parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: { gestorPfId: true },
    });

    const cicloVigente = await prisma.cicloPontos.findFirst({
      where: {
        gestorPfId: parceiro?.gestorPfId,
        status: "RESGATE_ABERTO",
      },
    });

    if (!cicloVigente) {
      return badRequest("Período de resgate não está aberto");
    }

    // Calcular saldo do parceiro no ciclo
    const creditos = await prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: {
        parceiroId,
        cicloPontosId: cicloVigente.id,
        tipo: "CREDITO",
      },
    });

    const debitos = await prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: {
        parceiroId,
        cicloPontosId: cicloVigente.id,
        tipo: "DEBITO",
      },
    });

    const estornos = await prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: {
        parceiroId,
        cicloPontosId: cicloVigente.id,
        tipo: "ESTORNO",
      },
    });

    const c = creditos._sum.quantidade || 0;
    const d = debitos._sum.quantidade || 0;
    const e = estornos._sum.quantidade || 0;
    const saldoAtual = c - d + e;

    if (saldoAtual < premio.custoPontos) {
      return badRequest(
        `Saldo insuficiente. Você possui ${saldoAtual} pontos e precisa de ${premio.custoPontos}`,
      );
    }

    // Criar solicitação e debitar pontos em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar solicitação de resgate
      const solicitacao = await tx.solicitacaoResgate.create({
        data: {
          parceiroId,
          premioId,
          cicloPontosId: cicloVigente.id,
          pontosDebitados: premio.custoPontos,
          status: "SOLICITADO",
        },
      });

      // Criar movimentação de débito
      await tx.movimentacaoPontos.create({
        data: {
          parceiroId,
          cicloPontosId: cicloVigente.id,
          tipo: "DEBITO",
          origem: "RESGATE",
          quantidade: premio.custoPontos,
          referenciaSolicitacaoResgateId: solicitacao.id,
          observacao: `Resgate de: ${premio.nome}`,
        },
      });

      return solicitacao;
    });

    return created({
      id: resultado.id,
      premioId,
      pontosDebitados: resultado.pontosDebitados,
      status: resultado.status,
      solicitadoEm: resultado.solicitadoEm.toISOString(),
      mensagem: "Solicitação de resgate criada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao solicitar resgate:", err);
    return badRequest("Erro ao solicitar resgate");
  }
}
