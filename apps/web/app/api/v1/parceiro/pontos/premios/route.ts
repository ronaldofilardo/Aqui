import { NextRequest } from "next/server";
import { requireParceiroWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    // Buscar informações do parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: { 
        comercial: { select: { lideranca: { select: { backofficeId: true } } } },
        gestor: { select: { lideranca: { select: { backofficeId: true } } } }
      },
    });

    const backofficeId = parceiro?.comercial?.lideranca?.backofficeId || parceiro?.gestor?.lideranca?.backofficeId;

    // Buscar ciclo vigente
    const cicloVigente = await prisma.cicloPontos.findFirst({
      where: {
        backofficeId,
        OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
      },
    });

    // Calcular saldo atual
    let saldoAtual = 0;
    if (cicloVigente) {
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
      saldoAtual = c - d + e;
    }

    // Buscar prêmios do backoffice
    const premios = await prisma.premio.findMany({
      where: {
        backofficeId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        custoPontos: true,
        imagemUrl: true,
      },
      orderBy: { custoPontos: "asc" },
    });

    // Determinar se está em período de resgate
    const emPeriodoResgate = cicloVigente?.status === "RESGATE_ABERTO";

    return ok({
      catalogo: {
        emPeriodoResgate,
        saldoAtual,
        premios: premios.map((p) => ({
          ...p,
          podeSolicitar: emPeriodoResgate && saldoAtual >= p.custoPontos,
        })),
      },
    });
  } catch (err) {
    console.error("Erro ao buscar catálogo:", err);
    return badRequest("Erro ao buscar catálogo");
  }
}
