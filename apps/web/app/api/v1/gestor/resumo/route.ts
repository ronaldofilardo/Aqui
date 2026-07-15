import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireGestorNivelInferiorWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, gestorId, error } = await requireGestorNivelInferiorWithScope();
  if (error) return error;

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [parceiros, indicados, producao] = await Promise.all([
    prisma.parceiro.count({
      where: { gestorId },
    }),
    prisma.indicado.count({
      where: {
        parceiro: { gestorId },
      },
    }),
    prisma.procedimentoPF.aggregate({
      where: {
        gestorId,
        dataReferencia: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      _sum: {
        totalPago: true,
      },
    }),
  ]);

  return ok({
    totalParceiros: parceiros,
    totalIndicados: indicados,
    producaoMes: Number(producao._sum.totalPago) || 0,
  });
}