import { NextRequest } from "next/server";
import { requireParceiroWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get("cicloPontosId");
    const referenciaMes = searchParams.get("referenciaMes");

    // Buscar informações do parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: { gestorPfId: true },
    });

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          gestorPfId: parceiro?.gestorPfId,
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      });

      if (!cicloVigente) {
        return badRequest("Nenhum ciclo vigente encontrado");
      }

      cicloId = cicloVigente.id;
    }

    // Se especificado mês, buscar snapshot
    if (referenciaMes) {
      const snapshot = await prisma.rankingSnapshot.findUnique({
        where: {
          cicloPontosId_referenciaMes: {
            cicloPontosId: cicloId,
            referenciaMes,
          },
        },
        include: {
          posicoes: {
            include: {
              parceiro: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
            orderBy: { posicao: "asc" },
          },
        },
      });

      if (!snapshot) {
        return badRequest(`Ranking para ${referenciaMes} não encontrado`);
      }

      const minhaPosition = snapshot.posicoes.find(
        (p) => p.parceiroId === parceiroId,
      );

      return ok({
        ranking: {
          mes: referenciaMes,
          minhaPositionNo: minhaPosition?.posicao || null,
          meusPontos: minhaPosition?.pontosAcumulados || 0,
          posicoes: snapshot.posicoes.map((p) => ({
            posicao: p.posicao,
            parceiro: p.parceiro.nome,
            pontosAcumulados: p.pontosAcumulados,
            euSou: p.parceiroId === parceiroId,
          })),
        },
      });
    }

    // Gerar ranking atual do ciclo
    const cycle = await prisma.cicloPontos.findUnique({
      where: { id: cicloId },
    });

    const parceiros = await prisma.parceiro.findMany({
      where: { gestorPfId: parceiro?.gestorPfId },
      select: { id: true, nome: true },
    });

    // Calcular pontos acumulados por parceiro no ciclo
    const rankingAtual = await Promise.all(
      parceiros.map(async (p) => {
        const creditos = await prisma.movimentacaoPontos.aggregate({
          _sum: { quantidade: true },
          where: {
            parceiroId: p.id,
            cicloPontosId: cicloId,
            tipo: "CREDITO",
          },
        });

        const debitos = await prisma.movimentacaoPontos.aggregate({
          _sum: { quantidade: true },
          where: {
            parceiroId: p.id,
            cicloPontosId: cicloId,
            tipo: "DEBITO",
          },
        });

        const estornos = await prisma.movimentacaoPontos.aggregate({
          _sum: { quantidade: true },
          where: {
            parceiroId: p.id,
            cicloPontosId: cicloId,
            tipo: "ESTORNO",
          },
        });

        const c = creditos._sum.quantidade || 0;
        const d = debitos._sum.quantidade || 0;
        const e = estornos._sum.quantidade || 0;

        return {
          parceiro: p,
          pontos: c - d + e,
        };
      }),
    );

    // Ordenar e atribuir posições
    const ranking = rankingAtual
      .sort((a, b) => b.pontos - a.pontos)
      .map((item, index) => ({
        posicao: index + 1,
        parceiro: item.parceiro.nome,
        pontosAcumulados: item.pontos,
        euSou: item.parceiro.id === parceiroId,
      }));

    const minhaPositionAtual = ranking.find((r) => r.euSou);

    return ok({
      ranking: {
        ciclo: {
          id: cicloId,
          nome: cycle?.nome,
          status: cycle?.status,
        },
        minhaPositionNo: minhaPositionAtual?.posicao || null,
        meusPontos: minhaPositionAtual?.pontosAcumulados || 0,
        posicoes: ranking,
      },
    });
  } catch (err) {
    console.error("Erro ao buscar ranking:", err);
    return badRequest("Erro ao buscar ranking");
  }
}
