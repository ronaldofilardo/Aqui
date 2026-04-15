import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, notFound } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;

  const cupomConfig = await prisma.cupomConfig.findUnique({
    where: { codigoCupom: codigo },
    include: {
      estabelecimento: {
        select: { nomeFantasia: true, cidade: true, estado: true },
      },
    },
  });

  if (!cupomConfig || cupomConfig.status !== "ATIVO") {
    return notFound("Cupom não encontrado ou inativo");
  }

  // Find latest available imported coupon for this config
  const cupomDisponivel = await prisma.cupomImportado.findFirst({
    where: {
      cupomConfigId: cupomConfig.id,
      status: "DISPONIVEL",
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok({
    codigo: cupomConfig.codigoCupom,
    descricao: cupomConfig.descricao,
    estabelecimento: cupomConfig.estabelecimento,
    disponivel: !!cupomDisponivel,
    cupomImportadoId: cupomDisponivel?.id || null,
    precoOriginal: cupomDisponivel?.precoOriginal || null,
    descontoPercentual: cupomDisponivel?.descontoPercentual || null,
    precoFinal: cupomDisponivel?.precoFinal || null,
  });
}
