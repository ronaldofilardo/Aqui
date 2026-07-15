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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    if (!cicloId) {
      const parceiro = await prisma.parceiro.findUnique({
        where: { id: parceiroId },
        select: { 
          comercial: { select: { lideranca: { select: { backofficeId: true } } } },
          gestor: { select: { lideranca: { select: { backofficeId: true } } } }
        },
      });

      const backofficeId = parceiro?.comercial?.lideranca?.backofficeId || parceiro?.gestor?.lideranca?.backofficeId;

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
    }

    // Buscar movimentações
    const movimentacoes = await prisma.movimentacaoPontos.findMany({
      where: {
        parceiroId,
        cicloPontosId: cicloId,
      },
      orderBy: { criadoEm: "desc" },
      take: limit,
      skip: offset,
    });

    // Calcular saldo progressivo
    let saldoProgressivo = 0;
    const extratoComSaldo = movimentacoes.map((m) => {
      const sinal = m.tipo === "CREDITO" ? 1 : m.tipo === "DEBITO" ? -1 : 1;
      saldoProgressivo += sinal * m.quantidade;

      return {
        id: m.id,
        data: m.criadoEm.toISOString(),
        tipo: m.tipo,
        origem: m.origem,
        quantidade: m.quantidade,
        saldoApos: saldoProgressivo,
        observacao: m.observacao,
      };
    });

    // Total de registros
    const total = await prisma.movimentacaoPontos.count({
      where: {
        parceiroId,
        cicloPontosId: cicloId,
      },
    });

    return ok({
      extrato: {
        cicloId,
        total,
        limit,
        offset,
        movimentacoes: extratoComSaldo.reverse(), // Ordenar em ordem crescente para exibição
      },
    });
  } catch (err) {
    console.error("Erro ao buscar extrato:", err);
    return badRequest("Erro ao buscar extrato");
  }
}
