import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireGestorPFWithScope } from "@/lib/api-helpers";

/**
 * GET /api/v1/gestor-pf/relatorio-comissoes
 * 
 * Query params:
 * - inicio: YYYY-MM (mês inicial)
 * - fim: YYYY-MM (mês final)
 * - comercialId: uuid (opcional, filtra por comercial)
 */
export async function GET(req: NextRequest) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const comercialId = searchParams.get("comercialId");

  if (!inicio || !fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  const where: any = {
    comercial: {
      gestorPfId,
    },
    mesReferencia: {
      gte: inicio,
      lte: fim,
    },
  };

  if (comercialId) {
    where.comercialId = comercialId;
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where,
    include: {
      comercial: {
        include: {
          usuario: {
            select: { nome: true, email: true },
          },
        },
      },
    },
    orderBy: { mesReferencia: "desc" },
  });

  // Agrupar por mês para totais
  const porMes = new Map<string, { totalVendas: number; totalComissao: number; quantidade: number }>();
  let totalGeralVendas = 0;
  let totalGeralComissao = 0;

  comissoes.forEach((c) => {
    const mes = c.mesReferencia;
    const atual = porMes.get(mes) || { totalVendas: 0, totalComissao: 0, quantidade: 0 };
    atual.totalVendas += Number(c.valorVendas);
    atual.totalComissao += Number(c.valorComissao);
    atual.quantidade += 1;
    porMes.set(mes, atual);

    totalGeralVendas += Number(c.valorVendas);
    totalGeralComissao += Number(c.valorComissao);
  });

  return ok({
    comissoes: comissoes.map((c) => ({
      id: c.id,
      mesReferencia: c.mesReferencia,
      comercial: {
        id: c.comercial.id,
        nome: c.comercial.nome,
        email: c.comercial.usuario.email,
        funcao: c.comercial.funcao,
      },
      valorVendas: Number(c.valorVendas),
      valorComissao: Number(c.valorComissao),
      status: c.status,
      dataPagamento: c.dataPagamento,
      createdAt: c.createdAt,
    })),
    resumo: {
      porMes: Array.from(porMes.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([mes, dados]) => ({
          mes,
          ...dados,
        })),
      totalGeral: {
        totalVendas: totalGeralVendas,
        totalComissao: totalGeralComissao,
        quantidade: comissoes.length,
      },
    },
  });
}