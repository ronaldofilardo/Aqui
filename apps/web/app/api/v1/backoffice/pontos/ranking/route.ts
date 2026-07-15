import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asa/database';
import { ok, badRequest, requireBackofficeWithScope } from '@/lib/api-helpers';
import { LRUCache } from 'lru-cache';

/**
 * Cache para ranking de pontos
 * Armazena ranking calculado por 5 minutos para evitar queries pesadas
 */
const rankingCache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutos
  updateAgeOnGet: false,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/backoffice/pontos/ranking
 * 
 * Retorna ranking de pontos do ciclo vigente ou de um ciclo específico.
 * Implementa cache de 5 minutos para melhorar performance.
 * 
 * Query params:
 * - cicloPontosId: UUID do ciclo (opcional, usa o vigente se não informado)
 * - referenciaMes: Mês de referência YYYY-MM (opcional, para snapshots históricos)
 * - forceRefresh: true para ignorar cache (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get('cicloPontosId');
    const referenciaMes = searchParams.get('referenciaMes');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId,
          OR: [{ status: 'EM_ANDAMENTO' }, { status: 'RESGATE_ABERTO' }],
        },
      });

      if (!cicloVigente) {
        return badRequest('Nenhum ciclo vigente encontrado');
      }

      cicloId = cicloVigente.id;
    }

    // Validar que o ciclo pertence ao backoffice
    const ciclo = await prisma.cicloPontos.findUnique({
      where: { id: cicloId },
    });

    if (!ciclo || ciclo.backofficeId !== backofficeId) {
      return badRequest('Ciclo não encontrado ou não pertence ao backoffice');
    }

    // Se especificado mês, buscar snapshot (não usa cache)
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
            orderBy: { posicao: 'asc' },
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

    // Verificar cache
    const cacheKey = `ranking:${cicloId}`;
    if (!forceRefresh) {
      const cached = rankingCache.get(cacheKey);
      if (cached) {
        return ok({
          ...cached,
          cached: true,
          cachedAt: new Date().toISOString(),
        });
      }
    }

    // Gerar ranking atual do ciclo (sem snapshot)
    // Buscar todas as lideranças e seus parceiros
    const liderancas = await prisma.lideranca.findMany({
      where: { backofficeId },
      include: {
        comerciais: { 
          include: { 
            parceiros: { 
              select: { 
                id: true, 
                nome: true, 
                cpf: true,
                usuario: { select: { email: true } }
              } 
            } 
          } 
        },
        gestores: { 
          include: { 
            parceiros: { 
              select: { 
                id: true, 
                nome: true, 
                cpf: true,
                usuario: { select: { email: true } }
              } 
            } 
          } 
        }
      }
    });

    const parceiros = [
      ...liderancas.flatMap(l => l.comerciais.flatMap(c => c.parceiros)),
      ...liderancas.flatMap(l => l.gestores.flatMap(g => g.parceiros))
    ];

    // Remover duplicatas
    const parceirosUnicos = Array.from(
      new Map(parceiros.map(p => [p.id, p])).values()
    );

    if (parceirosUnicos.length === 0) {
      const resultado = {
        ranking: {
          ciclo: {
            id: cicloId,
            nome: ciclo.nome,
            status: ciclo.status,
          },
          posicoes: [],
        },
      };
      
      // Cache mesmo se vazio
      rankingCache.set(cacheKey, resultado);
      
      return ok(resultado);
    }

    // Calcular pontos acumulados por parceiro no ciclo em paralelo
    const rankingAtual = await Promise.all(
      parceirosUnicos.map(async (p) => {
        const [creditos, debitos, estornos] = await Promise.all([
          prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: 'CREDITO',
            },
          }),
          prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: 'DEBITO',
            },
          }),
          prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: 'ESTORNO',
            },
          }),
        ]);

        const c = creditos._sum.quantidade || 0;
        const d = debitos._sum.quantidade || 0;
        const e = estornos._sum.quantidade || 0;

        return {
          parceiro: {
            id: p.id,
            nome: p.nome,
            cpf: p.cpf,
            email: p.usuario?.email,
          },
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

    const resultado = {
      ranking: {
        ciclo: {
          id: cicloId,
          nome: ciclo.nome,
          status: ciclo.status,
        },
        posicoes: ranking,
      },
    };

    // Armazenar em cache
    rankingCache.set(cacheKey, resultado);

    return ok(resultado);
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    return badRequest('Erro ao buscar ranking');
  }
}
