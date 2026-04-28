import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireEstabelecimento, ok } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireEstabelecimento();
  if (error) return error;

  const estabelecimentoId = (session!.user as any).estabelecimentoId as string;

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
  const mensal = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();
    const [count, soma] = await Promise.all([
      prisma.comissao.count({
        where: { estabelecimentoId, mesReferencia: mes, anoReferencia: ano },
      }),
      prisma.comissao.aggregate({
        where: { estabelecimentoId, mesReferencia: mes, anoReferencia: ano },
        _sum: { valorEstabelecimento: true },
      }),
    ]);
    mensal.push({
      mes: `${mesesLabels[mes - 1]}/${String(ano).slice(2)}`,
      consultas: count,
      comissao: Number(soma._sum.valorEstabelecimento || 0),
    });
  }

  // Totais globais
  const [totalConsultas, totalComissao] = await Promise.all([
    prisma.comissao.count({ where: { estabelecimentoId } }),
    prisma.comissao.aggregate({
      where: { estabelecimentoId },
      _sum: { valorEstabelecimento: true },
    }),
  ]);

  return ok({
    mensal,
    totais: {
      consultas: totalConsultas,
      comissao: Number(totalComissao._sum.valorEstabelecimento || 0),
    },
  });
}
