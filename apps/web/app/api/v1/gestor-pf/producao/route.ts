import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireGestorPFWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mesReferencia = searchParams.get("mesReferencia");
  const parceiroId = searchParams.get("parceiroId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    parceiroId: { not: null },
  };

  if (status && status !== "TODOS") {
    where.statusComissao = status;
  }

  if (parceiroId) {
    where.parceiroId = parceiroId;
  }

  const [procedimentos, total, parceiros, mesesDisponiveis] = await Promise.all([
    prisma.procedimentoPF.findMany({
      where,
      include: {
        parceiro: { select: { id: true, nome: true, cpf: true } },
        indicado: { select: { id: true, nome: true, cpf: true } },
        upload: { select: { id: true, nomeArquivo: true, mesReferencia: true } },
      },
      orderBy: { dataReferencia: "desc" },
      take: limit,
      skip,
    }),
    prisma.procedimentoPF.count({ where }),
    prisma.parceiro.findMany({
      where: { gestorPfId },
      select: { id: true, nome: true, cpf: true },
      orderBy: { nome: "asc" },
    }),
    prisma.procedimentoPF.findMany({
      where: { parceiroId: { not: null } },
      select: { dataReferencia: true },
      distinct: ["dataReferencia"],
      orderBy: { dataReferencia: "desc" },
    }),
  ]);

  const mesesSet = new Set<string>();
  for (const p of mesesDisponiveis) {
    const d = new Date(p.dataReferencia);
    mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return ok({
    procedimentos,
    parceiros,
    mesesDisponiveis: Array.from(mesesSet),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}