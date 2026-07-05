import { NextRequest } from "next/server";
import { requireParceiroWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: {
        gestorPfId: true,
        periodicidadeCicloEscolhida: true,
        _count: {
          select: { movimentacoesPontos: true },
        },
      },
    });

    if (!parceiro) {
      return ok({
        carteira: {
          saldoAtual: 0,
          cicloPontosId: null,
        },
        periodicidadeCicloEscolhida: null,
        temMovimentacoes: false,
      });
    }

    const periodicidadeEscolhida =
      parceiro.periodicidadeCicloEscolhida ?? null;
    const temMovimentacoes = parceiro._count.movimentacoesPontos > 0;

    const cicloVigente = await prisma.cicloPontos.findFirst({
      where: {
        gestorPfId: parceiro.gestorPfId,
        ...(periodicidadeEscolhida
          ? { periodicidade: periodicidadeEscolhida }
          : {}),
        OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
      },
    });

    if (!cicloVigente) {
      return ok({
        carteira: {
          saldoAtual: 0,
          cicloPontosId: null,
          cicloPontosNome: "Nenhum ciclo vigente",
          periodoAcumulo: null,
          periodoResgate: null,
        },
        periodicidadeCicloEscolhida: periodicidadeEscolhida,
        temMovimentacoes,
      });
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
    const saldo = c - d + e;

    return ok({
      carteira: {
        saldoAtual: saldo,
        cicloPontosId: cicloVigente.id,
        cicloPontosNome: cicloVigente.nome,
        periodicidade: cicloVigente.periodicidade,
        periodoAcumulo: {
          inicio: cicloVigente.inicioAcumuloEm.toISOString(),
          fim: cicloVigente.fimAcumuloEm.toISOString(),
        },
        periodoResgate:
          cicloVigente.status === "RESGATE_ABERTO"
            ? {
                inicio: cicloVigente.fimAcumuloEm.toISOString(),
                fim: cicloVigente.fimResgateEm.toISOString(),
              }
            : null,
        statusCiclo: cicloVigente.status,
      },
      periodicidadeCicloEscolhida: periodicidadeEscolhida,
      temMovimentacoes,
    });
  } catch (err) {
    console.error("Erro ao buscar carteira:", err);
    return badRequest("Erro ao buscar carteira");
  }
}
