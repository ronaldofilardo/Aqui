import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
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

  // Uma única query agrupada em vez de 12 queries sequenciais (fix N+1)
  const [groupedByMonth, topEstabsRaw, consultor, totalEstabelecimentos] =
    await Promise.all([
      prisma.comissao.groupBy({
        by: ["mesReferencia", "anoReferencia"],
        where: { consultorId },
        _count: { id: true },
      }),
      prisma.comissao.groupBy({
        by: ["estabelecimentoId"],
        where: { consultorId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.consultor.findUnique({
        where: { id: consultorId },
        select: { totalConsultas: true, totalComissoes: true },
      }),
      prisma.estabelecimento.count({
        where: { consultorId, status: "ATIVO" },
      }),
    ]);

  // Construir array de 12 meses (meses sem dados = 0)
  const byMonthMap = new Map(
    groupedByMonth.map((g: typeof groupedByMonth[0]) => [
      `${g.mesReferencia}-${g.anoReferencia}`,
      g._count.id,
    ]),
  );
  const mensal = ultimos12.map(({ mes, ano }) => ({
    mes: `${mesesLabels[mes - 1]}/${String(ano).slice(2)}`,
    consultas: byMonthMap.get(`${mes}-${ano}`) ?? 0,
    comissao: 0,
  }));

  // Top estabelecimentos
  const estabIds = topEstabsRaw.map((e: typeof topEstabsRaw[0]) => e.estabelecimentoId);
  const estabs: { id: string; nomeFantasia: string | null }[] =
    await prisma.estabelecimento.findMany({
      where: { id: { in: estabIds } },
      select: { id: true, nomeFantasia: true },
    });

  const topEstabelecimentos = topEstabsRaw.map((t: typeof topEstabsRaw[0]) => ({
    nome: estabs.find((e) => e.id === t.estabelecimentoId)?.nomeFantasia ?? "",
    consultas: t._count.id,
  }));

  return ok({
    mensal,
    topEstabelecimentos,
    totais: {
      consultasTotal: consultor?.totalConsultas ?? 0,
      comissaoTotal: Number(consultor?.totalComissoes ?? 0),
      estabelecimentos: totalEstabelecimentos,
    },
  });
}
