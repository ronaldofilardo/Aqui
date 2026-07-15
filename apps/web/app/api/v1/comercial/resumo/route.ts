import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireComercialWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, comercialId, error } = await requireComercialWithScope();
  if (error) return error;

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [parceiros, indicados, producao] = await Promise.all([
    prisma.parceiro.count({
      where: { comercialId },
    }),
    prisma.indicado.count({
      where: {
        parceiro: { comercialId },
      },
    }),
    prisma.procedimentoPF.aggregate({
      where: {
        comercialId,
        dataReferencia: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      _sum: {
        totalPago: true,
        valorComissao: true,
      },
    }),
  ]);

  return ok({
    totalParceiros: parceiros,
    totalIndicados: indicados,
    producaoMes: Number(producao._sum.totalPago) || 0,
    comissaoMes: Number(producao._sum.valorComissao) || 0,
  });
}