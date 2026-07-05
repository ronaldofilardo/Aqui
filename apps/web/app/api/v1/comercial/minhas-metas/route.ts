import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireComercialWithScope } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { comercialId, error } = await requireComercialWithScope();
  if (error) return error;

  const metas = await prisma.metaComercial.findMany({
    where: { comercialId },
    orderBy: { mesReferencia: "desc" },
    take: 12,
  });

  const now = new Date();
  const currentMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const metaAtual = metas.find((m) => m.mesReferencia === currentMes) ?? null;

  return ok({
    mesReferencia: currentMes,
    metaAtual,
    historico: metas,
  });
}
