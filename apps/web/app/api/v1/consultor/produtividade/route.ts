import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireConsultor, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const consultorId = session!.user.consultorId!;

  // Monthly stats for last 12 months
  const now = new Date();
  const stats = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();
    const count = await prisma.comissao.count({
      where: { consultorId, mesReferencia: mes, anoReferencia: ano },
    });
    stats.push({ mes, ano, totalConsultas: count });
  }

  // Top estabelecimentos
  const topEstabs = await prisma.comissao.groupBy({
    by: ["estabelecimentoId"],
    where: { consultorId },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const estabIds: string[] = topEstabs.map((e: any) => e.estabelecimentoId);
  const estabs = await prisma.estabelecimento.findMany({
    where: { id: { in: estabIds } },
    select: { id: true, nomeFantasia: true },
  });

  const ranking = topEstabs.map((t: any) => ({
    estabelecimento: estabs.find((e: any) => e.id === t.estabelecimentoId)?.nomeFantasia || "",
    totalConsultas: t._count.id,
  }));

  const consultor = await prisma.consultor.findUnique({
    where: { id: consultorId },
    select: { totalConsultas: true, totalComissoes: true },
  });

  const mesesLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return ok({
    mensal: stats.reverse().map((s) => ({
      mes: `${mesesLabels[s.mes - 1]}/${String(s.ano).slice(2)}`,
      consultas: s.totalConsultas,
      comissao: 0,
    })),
    topEstabelecimentos: ranking.map((r) => ({
      nome: r.estabelecimento,
      consultas: r.totalConsultas,
    })),
    totais: {
      consultasTotal: consultor?.totalConsultas || 0,
      comissaoTotal: Number(consultor?.totalComissoes || 0),
      estabelecimentos: await prisma.estabelecimento.count({
        where: { consultorId, status: "ATIVO" },
      }),
    },
  });
}
