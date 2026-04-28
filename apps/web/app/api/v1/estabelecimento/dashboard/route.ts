import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireEstabelecimento, ok } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireEstabelecimento();
  if (error) return error;

  const estabelecimentoId = (session!.user as any).estabelecimentoId as string;

  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();

  // Contadores do mês atual
  const [consultasMes, comissoesMes] = await Promise.all([
    prisma.comissao.count({
      where: {
        estabelecimentoId,
        mesReferencia: mesAtual,
        anoReferencia: anoAtual,
      },
    }),
    prisma.comissao.aggregate({
      where: {
        estabelecimentoId,
        mesReferencia: mesAtual,
        anoReferencia: anoAtual,
      },
      _sum: { valorEstabelecimento: true },
    }),
  ]);

  // Totais históricos
  const [consultasTotal, comissoesTotal] = await Promise.all([
    prisma.comissao.count({ where: { estabelecimentoId } }),
    prisma.comissao.aggregate({
      where: { estabelecimentoId },
      _sum: { valorEstabelecimento: true },
    }),
  ]);

  // Evolução últimos 6 meses
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
  const evolucao = [];
  for (let i = 5; i >= 0; i--) {
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
    evolucao.push({
      mes: `${mesesLabels[mes - 1]}/${String(ano).slice(2)}`,
      consultas: count,
      comissao: Number(soma._sum.valorEstabelecimento || 0),
    });
  }

  return ok({
    mes: mesAtual,
    ano: anoAtual,
    mesSelecionado: {
      consultas: consultasMes,
      comissao: Number(comissoesMes._sum.valorEstabelecimento || 0),
    },
    totais: {
      consultas: consultasTotal,
      comissao: Number(comissoesTotal._sum.valorEstabelecimento || 0),
    },
    evolucao,
  });
}
