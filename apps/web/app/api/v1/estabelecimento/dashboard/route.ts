import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireEstabelecimento, ok } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireEstabelecimento();
  if (error) return error;

  const estabelecimentoId = session!.user.estabelecimentoId!;

  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();

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

  // Últimos 6 meses
  const ultimos6: { mes: number; ano: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ultimos6.push({ mes: d.getMonth() + 1, ano: d.getFullYear() });
  }

  const cupomScope = { status: "USADO" as const, cupomConfig: { estabelecimentoId } };

  const [groupedByMonth, totalCount] = await Promise.all([
    prisma.cupomImportado.groupBy({
      by: ["mesReferencia", "anoReferencia"],
      where: cupomScope,
      _count: { id: true },
    }),
    prisma.cupomImportado.count({ where: cupomScope }),
  ]);

  const byMonthMap = new Map(
    groupedByMonth.map((g: (typeof groupedByMonth)[0]) => [
      `${g.mesReferencia}-${g.anoReferencia}`,
      g._count.id,
    ]),
  );

  const evolucao = ultimos6.map(({ mes, ano }) => ({
    mes: `${mesesLabels[mes - 1]}/${String(ano).slice(2)}`,
    consultas: byMonthMap.get(`${mes}-${ano}`) ?? 0,
  }));

  const mesSelecionado = byMonthMap.get(`${mesAtual}-${anoAtual}`) ?? 0;

  return ok({
    mes: mesAtual,
    ano: anoAtual,
    mesSelecionado: {
      consultas: mesSelecionado,
    },
    totais: {
      consultas: totalCount,
    },
    evolucao,
  });
}
