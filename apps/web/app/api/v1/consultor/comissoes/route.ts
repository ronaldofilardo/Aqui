import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { requireConsultor, ok, badRequest } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  try {
    const { searchParams } = req.nextUrl;
    const mes = parseInt(
      searchParams.get("mes") || (new Date().getMonth() + 1).toString()
    );
    const ano = parseInt(
      searchParams.get("ano") || new Date().getFullYear().toString()
    );

    // Get all estabelecimentos for this consultor
    const estabelecimentos = await prisma.estabelecimento.findMany({
      where: {
        consultor: {
          usuario: {
            id: session!.user.id,
          },
        },
      },
      select: {
        id: true,
        nomeFantasia: true,
        cupomConfig: {
          select: {
            id: true,
          },
        },
      },
    });

    const comissoes = [];

    for (const estab of estabelecimentos) {
      if (!estab.cupomConfig?.id) continue;

      // Get cupons for this establishment in the selected month/year
      const cupons = await prisma.cupomImportado.findMany({
        where: {
          cupomConfigId: estab.cupomConfig.id,
          mesReferencia: mes,
          anoReferencia: ano,
        },
        select: {
          precoFinal: true,
          criadoEm: true,
        },
      });

      if (cupons.length === 0) continue;

      const valorBruto = cupons.reduce((sum, c) => sum + Number(c.precoFinal), 0);
      // Comissão fixa: R$20 por consulta para consultor
      const valorComissao = cupons.length * 20;

      comissoes.push({
        id: `${estab.id}-${mes}-${ano}`,
        periodo: new Date(ano, mes - 1).toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
        estabelecimentoNome: estab.nomeFantasia,
        consultasCount: cupons.length,
        valorBruto: Number(valorBruto.toFixed(2)),
        percentual: 100, // Será mostrado como valor fixo
        valorComissao: Number(valorComissao.toFixed(2)),
        status: "PENDENTE", // For now, all are pending (no payment table)
        criadoEm: cupons[0].criadoEm.toISOString(),
        pixChave: undefined,
      });
    }

    // Calculate summary
    const totalPago = 0;
    const totalPendente = comissoes.reduce(
      (sum, c) => sum + c.valorComissao,
      0
    );
    const total = totalPago + totalPendente;

    return ok({
      data: comissoes.sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      ),
      resumo: {
        totalPago,
        totalPendente: Number(totalPendente.toFixed(2)),
        total: Number(total.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("[comissoes-consultor]", err);
    return badRequest("Erro ao carregar comissões");
  }
}
