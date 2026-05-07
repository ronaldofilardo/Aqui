import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestorWithScope, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const mes = parseInt(
    searchParams.get("mes") || (new Date().getMonth() + 1).toString()
  );
  const ano = parseInt(
    searchParams.get("ano") || new Date().getFullYear().toString()
  );

  // Buscar todos os estabelecimentos do gestor
  const estabelecimentos = await prisma.estabelecimento.findMany({
    where: { consultorId: { in: consultorIds } },
    select: {
      id: true,
      nomeFantasia: true,
      consultor: {
        select: {
          id: true,
          usuario: { select: { id: true, nome: true, email: true } },
        },
      },
      cupomConfig: { select: { id: true } },
    },
  });

  const comissoes: any[] = [];
  let totalMes = 0;

  for (const estab of estabelecimentos) {
    if (!estab.cupomConfig?.id) continue;

    // Contar consultas REALIZADA neste mês/ano
    const cuponsUsados = await prisma.cupomImportado.count({
      where: {
        cupomConfigId: estab.cupomConfig.id,
        mesReferencia: mes,
        anoReferencia: ano,
        consulta: { status: "REALIZADA" },
      },
    });

    if (cuponsUsados > 0) {
      const comissaoConsultor = cuponsUsados * 2000; // R$20.00 em centavos
      const comissaoEstabelecimento = cuponsUsados * 1000; // R$10.00 em centavos
      const subtotal = comissaoConsultor + comissaoEstabelecimento;
      totalMes += subtotal;

      comissoes.push({
        consultorId: estab.consultor.id,
        consultorNome: estab.consultor.usuario.nome,
        consultorEmail: estab.consultor.usuario.email,
        estabelecimentoId: estab.id,
        estabelecimentoNome: estab.nomeFantasia,
        consultasRealizadas: cuponsUsados,
        comissaoConsultor,
        comissaoEstabelecimento,
        subtotal,
      });
    }
  }

  return ok({ comissoes, totalMes, mes, ano });
}
