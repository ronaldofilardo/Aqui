import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { forbidden, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  // Buscar comercial e verificar se pertence a uma liderança deste backoffice
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  // Verificar se a liderança pertence a este backoffice
  if (comercial.lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where: { comercialId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}

