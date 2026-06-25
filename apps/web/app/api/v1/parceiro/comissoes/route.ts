import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, notFound, requireParceiroWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, parceiroId, error } = await requireParceiroWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mesReferencia = searchParams.get("mesReferencia");

  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      parceiroId,
      ...(mesReferencia && {
        dataReferencia: {
          gte: new Date(`${mesReferencia}-01`),
          lt: new Date(`${mesReferencia}-31`),
        },
      }),
    },
    include: {
      indicado: {
        select: { id: true, nome: true, cpf: true },
      },
    },
    orderBy: { dataReferencia: "desc" },
  });

  const totalComissao = procedimentos.reduce(
    (sum, p) => sum + Number(p.valorComissao),
    0
  );

  const totalPago = procedimentos
    .filter((p) => p.statusComissao === "PAGA")
    .reduce((sum, p) => sum + Number(p.valorComissao), 0);

  const totalPendente = procedimentos
    .filter((p) => p.statusComissao !== "PAGA")
    .reduce((sum, p) => sum + Number(p.valorComissao), 0);

  const comissoesPorMes = await prisma.comissaoParceiro.findMany({
    where: { parceiroId },
    orderBy: { mesReferencia: "desc" },
    take: 12,
  });

  return ok({
    procedimentos,
    resumo: {
      totalComissao,
      totalPago,
      totalPendente,
      totalProcedimentos: procedimentos.length,
    },
    historico: comissoesPorMes,
  });
}