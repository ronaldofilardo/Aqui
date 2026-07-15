import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireLiderancaWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Buscar todos os comerciais e gestores desta liderança
  const [comerciais, gestores] = await Promise.all([
    prisma.comercial.findMany({
      where: { liderancaId: lideranca!.id },
      select: { id: true },
    }),
    prisma.gestor.findMany({
      where: { liderancaId: lideranca!.id },
      select: { id: true },
    }),
  ]);

  const comercialIds = comerciais.map((c) => c.id);
  const gestorIds = gestores.map((g) => g.id);

  // Buscar produção do mês
  const [producaoComercial, producaoGestor] = await Promise.all([
    comercialIds.length > 0
      ? prisma.procedimentoPF.aggregate({
          where: {
            comercialId: { in: comercialIds },
            dataReferencia: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
          _sum: {
            totalPago: true,
            valorComissao: true,
          },
        })
      : Promise.resolve({ _sum: { totalPago: 0, valorComissao: 0 } }),
    gestorIds.length > 0
      ? prisma.procedimentoPF.aggregate({
          where: {
            gestorId: { in: gestorIds },
            dataReferencia: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
          _sum: {
            totalPago: true,
          },
        })
      : Promise.resolve({ _sum: { totalPago: 0 } }),
  ]);

  const producaoMes =
    (Number(producaoComercial._sum.totalPago) || 0) +
    (Number(producaoGestor._sum.totalPago) || 0);

  const comissaoMes = Number(producaoComercial._sum.valorComissao) || 0;

  return ok({
    producaoMes,
    comissaoMes,
  });
}