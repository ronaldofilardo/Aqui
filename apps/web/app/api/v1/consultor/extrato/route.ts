import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireConsultor, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const pagamentos = await prisma.pagamento.findMany({
    where: { consultorId: session!.user.consultorId! },
    orderBy: [{ anoReferencia: "desc" }, { mesReferencia: "desc" }],
  });

  const totalRecebido = pagamentos
    .filter((p) => p.status === "PAGO")
    .reduce((sum, p) => sum + Number(p.valorTotal), 0);

  return ok({
    pagamentos,
    totalRecebido,
  });
}
