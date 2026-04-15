import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireGestor();
  if (error) return error;

  const estabelecimentos = await prisma.estabelecimento.findMany({
    include: {
      consultor: { include: { usuario: { select: { nome: true } } } },
      cupomConfig: true,
      _count: { select: { documentos: true, comissoes: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok(estabelecimentos);
}
