import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireEstabelecimento, ok } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireEstabelecimento();
  if (error) return error;

  const estabelecimentoId = session!.user.estabelecimentoId!;

  const now = new Date();
  const mesesLabels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  // Últimos 12 meses
  const ultimos12: { mes: number; ano: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ultimos12.push({ mes: d.getMonth() + 1, ano: d.getFullYear() });
  }

  // Uma única query agrupada + totais em paralelo (fix N+1)
  const [groupedByMonth, totaisAggregate] = await Promise.all([
    prisma.comissao.groupBy({
      by: ["mesReferencia", "anoReferencia"],
      where: { estabelecimentoId },
      _count: { id: true },
      _sum: { valorEstabelecimento: true },
    }),
    prisma.comissao.aggregate({
      where: { estabelecimentoId },
      _count: { id: true },
      _sum: { valorEstabelecimento: true },
    }),
  ]);

  const byMonthMap = new Map(
    groupedByMonth.map((g: typeof groupedByMonth[0]) => [
      `${g.mesReferencia}-${g.anoReferencia}`,
      { count: g._count.id, soma: Number(g._sum.valorEstabelecimento ?? 0) },
    ]),
  );

  const mensal = ultimos12.map(({ mes, ano }) => {
    const d = byMonthMap.get(`${mes}-${ano}`) ?? { count: 0, soma: 0 };
    return {
      mes: `${mesesLabels[mes - 1]}/${String(ano).slice(2)}`,
      consultas: d.count,
      comissao: d.soma,
    };
  });

  return ok({
    mensal,
    totais: {
      consultas: totaisAggregate._count.id,
      comissao: Number(totaisAggregate._sum.valorEstabelecimento ?? 0),
    },
  });
}
