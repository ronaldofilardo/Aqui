import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestorWithScope, ok } from "@/lib/api-helpers";

export async function GET() {
  const { error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  const estabelecimentos = await prisma.estabelecimento.findMany({
    where: { consultorId: { in: consultorIds } },
    include: {
      consultor: { include: { usuario: { select: { nome: true } } } },
      cupomConfig: true,
      _count: { select: { documentos: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok(estabelecimentos);
}
