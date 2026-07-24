import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { ok, requireGestorWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, consultorIds, error } = await requireGestorWithScope();
  if (error) return error;

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const whereConsultores =
    consultorIds.length > 0
      ? { consultorId: { in: consultorIds } }
      : { id: "-1" };

  const [totalConsultores, totalEstabelecimentos, cuponsMes, consultasMes] =
    await Promise.all([
      prisma.consultor.count({ where: { id: { in: consultorIds } } }),
      prisma.estabelecimento.count({ where: whereConsultores }),
      prisma.cupomImportado.count({
        where: {
          criadoEm: { gte: inicioMes, lte: fimMes },
          cupomConfig: { estabelecimento: whereConsultores },
        },
      }),
      prisma.consulta.count({
        where: {
          status: "REALIZADA",
          criadoEm: { gte: inicioMes, lte: fimMes },
          cupomImportado: {
            cupomConfig: { estabelecimento: whereConsultores },
          },
        },
      }),
    ]);

  return ok({
    totalConsultores,
    totalEstabelecimentos,
    cuponsMes,
    consultasMes,
  });
}
