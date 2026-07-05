import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { notFound, ok, requireGestorPFWithScope } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id, gestorPfId },
    select: { id: true },
  });
  if (!comercial) return notFound("Comercial não encontrado");

  const comissoes = await prisma.comissaoComercial.findMany({
    where: { comercialId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}
