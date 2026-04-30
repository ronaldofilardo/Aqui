import { prisma } from "@asa/database";
import { requireGestorWithScope, ok } from "@/lib/api-helpers";

function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

export async function GET() {
  const { error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  // Mês anterior
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anoAnterior = mes === 1 ? ano - 1 : ano;

  const scopeFilter = { consultorId: { in: consultorIds } };

  const [
    totalConsultores,
    totalEstabelecimentos,
    consultasMes,
    consultasMesAnterior,
    comissoesPendentes,
    comissoesPendentesAnterior,
    comissoesPagas,
    comissoesPagasAnterior,
    totalCuponsImportados,
    totalCuponsImportadosAnterior,
    valorPendentesAgg,
    valorPagasAgg,
  ] = await Promise.all([
    prisma.consultor.count({ where: { id: { in: consultorIds } } }),
    prisma.estabelecimento.count({
      where: { status: "ATIVO", consultorId: { in: consultorIds } },
    }),
    prisma.comissao.count({
      where: { mesReferencia: mes, anoReferencia: ano, ...scopeFilter },
    }),
    prisma.comissao.count({
      where: {
        mesReferencia: mesAnterior,
        anoReferencia: anoAnterior,
        ...scopeFilter,
      },
    }),
    prisma.comissao.count({
      where: { statusPagamento: "PENDENTE", ...scopeFilter },
    }),
    prisma.comissao.count({
      where: {
        statusPagamento: "PENDENTE",
        mesReferencia: mesAnterior,
        anoReferencia: anoAnterior,
        ...scopeFilter,
      },
    }),
    prisma.comissao.count({
      where: { statusPagamento: "PAGO", ...scopeFilter },
    }),
    prisma.comissao.count({
      where: {
        statusPagamento: "PAGO",
        mesReferencia: mesAnterior,
        anoReferencia: anoAnterior,
        ...scopeFilter,
      },
    }),
    prisma.cupomImportado.count({
      where: {
        cupomConfig: { estabelecimento: { consultorId: { in: consultorIds } } },
      },
    }),
    prisma.cupomImportado.count({
      where: {
        mesReferencia: mesAnterior,
        anoReferencia: anoAnterior,
        cupomConfig: { estabelecimento: { consultorId: { in: consultorIds } } },
      },
    }),
    prisma.comissao.aggregate({
      _sum: { valorConsultor: true },
      where: { statusPagamento: "PENDENTE", ...scopeFilter },
    }),
    prisma.comissao.aggregate({
      _sum: { valorConsultor: true },
      where: { statusPagamento: "PAGO", ...scopeFilter },
    }),
  ]);

  // Top consultores
  const topConsultores = await prisma.consultor.findMany({
    where: { id: { in: consultorIds } },
    include: { usuario: { select: { nome: true } } },
    orderBy: { totalConsultas: "desc" },
    take: 5,
  });

  // Monthly evolution (last 6 months) — parallel queries
  const evolucaoMeses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ano, mes - 1 - i, 1);
    return { mes: d.getMonth() + 1, ano: d.getFullYear() };
  });

  const evolucaoCounts = await Promise.all(
    evolucaoMeses.map(({ mes: m, ano: a }) =>
      prisma.comissao.count({
        where: { mesReferencia: m, anoReferencia: a, ...scopeFilter },
      }),
    ),
  );

  const evolucao = evolucaoMeses
    .map(({ mes: m, ano: a }, i) => ({
      mes: m,
      ano: a,
      totalConsultas: evolucaoCounts[i],
    }))
    .reverse();

  return ok({
    resumo: {
      totalConsultores,
      totalEstabelecimentos,
      consultasMes,
      consultasMesAnterior,
      variacaoConsultas: calcularVariacao(consultasMes, consultasMesAnterior),
      comissoesPendentes,
      comissoesPendentesAnterior,
      variacaoPendentes: calcularVariacao(
        comissoesPendentes,
        comissoesPendentesAnterior,
      ),
      comissoesPagas,
      comissoesPagasAnterior,
      variacaoPagas: calcularVariacao(comissoesPagas, comissoesPagasAnterior),
      valorComissoesPendentes: Number(
        valorPendentesAgg._sum.valorConsultor ?? 0,
      ),
      valorComissoesPagas: Number(valorPagasAgg._sum.valorConsultor ?? 0),
      totalCuponsImportados,
      totalCuponsImportadosAnterior,
      variacaoCupons: calcularVariacao(
        totalCuponsImportados,
        totalCuponsImportadosAnterior,
      ),
      mesAtual: mes,
      anoAtual: ano,
    },
    topConsultores: topConsultores.map((c: (typeof topConsultores)[0]) => ({
      nome: c.usuario.nome,
      totalConsultas: c.totalConsultas,
      totalComissoes: Number(c.totalComissoes),
    })),
    evolucao: evolucao,
  });
}
