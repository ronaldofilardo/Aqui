import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireComercialWithScope,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { comercialId, error } = await requireComercialWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mesReferencia = searchParams.get("mesReferencia");

  const now = new Date();
  const currentMes = mesReferencia
    ? mesReferencia
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const where: any = { comercialId };
  if (mesReferencia) where.mesReferencia = mesReferencia;

  const comissoes = await prisma.comissaoComercial.findMany({
    where,
    orderBy: { mesReferencia: "desc" },
    take: mesReferencia ? 1 : 12,
  });

  const comercial = await prisma.comercial.findUnique({
    where: { id: comercialId },
    select: {
      nome: true,
      cpf: true,
      percentualComissao: true,
      usuario: { select: { email: true } },
    },
  });

  return ok({
    comercial: {
      nome: comercial?.nome,
      cpf: comercial?.cpf,
      email: comercial?.usuario.email,
      percentualComissao: comercial?.percentualComissao,
    },
    mesReferencia: currentMes,
    comissaoAtual: comissoes.find((c) => c.mesReferencia === currentMes) ?? null,
    historico: comissoes,
  });
}
