import { NextRequest } from "next/server";
import { requireGestorPFWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, gestorPfId, error } = await requireGestorPFWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get("cicloPontosId");
    const referenciaMes = searchParams.get("referenciaMes"); // formato: YYYY-MM

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          gestorPfId,
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      });

      if (!cicloVigente) {
        return badRequest("Nenhum ciclo vigente encontrado");
      }

      cicloId = cicloVigente.id;
    }

    // Validar que o ciclo pertence ao gestor
    const ciclo = await prisma.cicloPontos.findUnique({
      where: { id: cicloId },
    });

    if (!ciclo || ciclo.gestorPfId !== gestorPfId) {
      return badRequest("Ciclo não encontrado ou não pertence ao gestor");
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
                  cpf: true,
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

      return ok({
        ranking: {
          mes: referenciaMes,
          geradoEm: snapshot.geradoEm.toISOString(),
          posicoes: snapshot.posicoes.map((p) => ({
            posicao: p.posicao,
            parceiro: p.parceiro,
            pontosAcumulados: p.pontosAcumulados,
          })),
        },
      });
    }

    // Gerar ranking atual do ciclo (sem snapshot)
    const parceiros = await prisma.parceiro.findMany({
      where: { gestorPfId },
      select: { id: true, nome: true, cpf: true },
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
        parceiro: item.parceiro,
        pontosAcumulados: item.pontos,
      }));

    return ok({
      ranking: {
        ciclo: {
          id: cicloId,
          nome: ciclo.nome,
          status: ciclo.status,
        },
        posicoes: ranking,
      },
    });
  } catch (err) {
    console.error("Erro ao buscar ranking:", err);
    return badRequest("Erro ao buscar ranking");
  }
}
