import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { requireConsultor, ok } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const consultorId = session!.user.consultorId!;
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
  const ultimos12: { mes: number; ano: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ultimos12.push({ mes: d.getMonth() + 1, ano: d.getFullYear() });
  }

  const cupomScope = {
    cupomConfig: { estabelecimento: { consultorId } },
  };

  const [groupedByMonth, topCupomConfigs, consultor, totalEstabelecimentos] =
    await Promise.all([
      prisma.cupomImportado.groupBy({
        by: ["mesReferencia", "anoReferencia"],
        where: { status: "USADO", ...cupomScope },
        _count: { id: true },
      }),
      prisma.cupomConfig.findMany({
        where: { estabelecimento: { consultorId } },
        include: {
          estabelecimento: { select: { nomeFantasia: true } },
          _count: { select: { cuponsImportados: { where: { status: "USADO" } } } },
        },
        orderBy: { cuponsImportados: { _count: "desc" } },
        take: 5,
      }),
      prisma.consultor.findUnique({
        where: { id: consultorId },
        select: { totalConsultas: true },
      }),
      prisma.estabelecimento.count({
        where: { consultorId, status: "ATIVO" },
      }),
    ]);

  const byMonthMap = new Map(
    groupedByMonth.map((g: (typeof groupedByMonth)[0]) => [
      `${g.mesReferencia}-${g.anoReferencia}`,
      g._count.id,
    ]),
  );
  const mensal = ultimos12.map(({ mes, ano }) => ({
    mes: `${mesesLabels[mes - 1]}/${String(ano).slice(2)}`,
    consultas: byMonthMap.get(`${mes}-${ano}`) ?? 0,
  }));

  const topEstabelecimentos = topCupomConfigs.map((cc: (typeof topCupomConfigs)[0]) => ({
    nome: cc.estabelecimento.nomeFantasia,
    consultas: cc._count.cuponsImportados,
  }));

  return ok({
    mensal,
    topEstabelecimentos,
    totais: {
      consultasTotal: consultor?.totalConsultas ?? 0,
      estabelecimentos: totalEstabelecimentos,
    },
  });
}
