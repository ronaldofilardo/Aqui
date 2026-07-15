import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  unauthorized,
} from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@asa/database";
import { calcularPontosDeProducao, obterCicloVigente } from "@/lib/pontos-utils";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  // Rate limiting: 10 requisições por minuto
  const rateLimitResponse = await rateLimit(req, { limit: 10, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json();
    const { producaoId } = body;

    if (!producaoId) {
      return badRequest("producaoId é obrigatório");
    }

// Buscar produção
    const producao = await prisma.procedimentoPF.findUnique({
      where: { id: producaoId },
      include: {
        parceiro: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        comercial: {
          select: {
            id: true,
            lideranca: {
              select: { backofficeId: true }
            }
          }
        },
        gestor: {
          select: {
            id: true,
            lideranca: {
              select: { backofficeId: true }
            }
          }
        }
      },
    });

    if (!producao || !producao.parceiroId) {
      return badRequest("Produção não encontrada ou não tem parceiro associado");
    }

    // Verificar permissão: o comercial ou gestor deve pertencer a uma liderança deste backoffice
    const pertenceAobackoffice = (
      producao.comercial?.lideranca?.backofficeId === backofficeId ||
      producao.gestor?.lideranca?.backofficeId === backofficeId
    );

    if (!pertenceAobackoffice) {
      return unauthorized();
    }

    // Verificar se já existe pontos para esta produção
    const pontosExistentes = await prisma.movimentacaoPontos.findFirst({
      where: {
        referenciaProcedimentoId: producao.id,
        origem: "PRODUCAO_IMPORTADA",
      },
    });

    if (pontosExistentes) {
      return badRequest("Pontos já foram distribuídos para esta produção");
    }

    // Obter ciclo vigente
    const cicloVigente = await obterCicloVigente(backofficeId);

    if (!cicloVigente) {
      return badRequest(
        "Nenhum ciclo de pontos vigente encontrado. Crie um ciclo antes de distribuir pontos.",
      );
    }

    // Verificar se a data da produção está dentro do período de acumulo do ciclo
    const dataProducao = producao.dataReferencia;
    if (
      dataProducao < cicloVigente.inicioAcumuloEm ||
      dataProducao > cicloVigente.fimAcumuloEm
    ) {
      return badRequest(
        `A produção não está dentro do período de acumulo do ciclo vigente (${cicloVigente.nome})`,
      );
    }

// Calcular pontos baseado no total pago e configuração vigente
    const totalPago = Number(producao.totalPago) || 0;
    
    if (totalPago <= 0) {
      return badRequest("Total pago deve ser maior que zero para gerar pontos");
    }

    const pontos = await calcularPontosDeProducao(
      totalPago,
      dataProducao,
      backofficeId,
    );

    if (pontos <= 0) {
      return badRequest("Pontos calculados é zero ou negativo");
    }

// Criar movimentação de crédito em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar movimentação de crédito
      const movimentacao = await tx.movimentacaoPontos.create({
        data: {
          parceiroId: producao.parceiroId!,
          cicloPontosId: cicloVigente.id,
          tipo: "CREDITO",
          quantidade: pontos,
          descricao: `Pontos por produção: ${producao.procedimento.substring(0, 50)}`,
          referenciaProcedimentoId: producao.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      return {
        movimentacao: {
          id: movimentacao.id,
          tipo: movimentacao.tipo,
          quantidade: movimentacao.quantidade,
        },
      };
    });

    return ok({
      mensagem: "Pontos distribuídos com sucesso",
      pontos: pontos,
      ciclo: {
        id: cicloVigente.id,
        nome: cicloVigente.nome,
      },
parceiro: {
        id: producao.parceiro!.id,
        nome: producao.parceiro!.nome,
      },
      detalhes: resultado,
    });
  } catch (err) {
    console.error("Erro ao distribuir pontos:", err);
    return badRequest("Erro ao distribuir pontos");
  }
}

export async function GET(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get("cicloPontosId");

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    let cicloNome = "";
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId,
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      });

      if (!cicloVigente) {
        return badRequest("Nenhum ciclo vigente encontrado");
      }

      cicloId = cicloVigente.id;
      cicloNome = cicloVigente.nome;
    }

// Buscar todas as lideranças deste backoffice
    const liderancas = await prisma.lideranca.findMany({
      where: { backofficeId },
      include: {
        comerciais: { include: { parceiros: true } },
        gestores: { include: { parceiros: true } }
      }
    });

    // Coletar todos os IDs de parceiros
    const parceiroIds = [
      ...liderancas.flatMap(l => l.comerciais.flatMap(c => c.parceiros.map(p => p.id))),
      ...liderancas.flatMap(l => l.gestores.flatMap(g => g.parceiros.map(p => p.id)))
    ];

    // Buscar todas as produções com estes parceiros
    const producoes = await prisma.procedimentoPF.findMany({
      where: {
        parceiroId: parceiroIds.length > 0 ? { in: parceiroIds } : undefined,
      },
      include: {
        parceiro: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
      },
      orderBy: {
        dataReferencia: "desc",
      },
    });

    // Buscar pontos já distribuídos
    const pontosDistribuidos = await prisma.movimentacaoPontos.findMany({
      where: {
        cicloPontosId: cicloId,
        origem: "PRODUCAO_IMPORTADA",
      },
      include: {
        parceiro: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const producoesComPontos = await Promise.all(producoes.map(async (producao) => {
      const pontos = pontosDistribuidos.find((p) => p.referenciaProcedimentoId === producao.id);
      
      // Calcular pontos potenciais para este procedimento
      let pontosPotenciais = 0;
      let erroCalculo = null;
      try {
        pontosPotenciais = await calcularPontosDeProducao(
          producao.totalPago,
          producao.dataReferencia,
          backofficeId,
        );
      } catch (err: any) {
        erroCalculo = err.message;
      }
      
      return {
        id: producao.id,
        dataProcedimento: producao.dataReferencia.toISOString(),
        dataReferencia: producao.dataReferencia.toISOString(),
        procedimento: producao.procedimento,
        paciente: producao.paciente,
        totalPago: producao.totalPago?.toString() || "0",
        parceiro: producao.parceiro,
        pontosDistribuidos: pontos ? {
          id: pontos.id,
          pontos: pontos.quantidade,
          dataReferencia: pontos.criadoEm.toISOString(),
        } : null,
        pontosPotenciais,
        erroCalculo,
      };
    }));

    return ok({
      producoes: producoesComPontos,
      ciclo: {
        id: cicloId,
        nome: cicloNome,
      },
    });
  } catch (err) {
    console.error("Erro ao buscar produções para pontos:", err);
    return badRequest("Erro ao buscar produções");
  }
}

