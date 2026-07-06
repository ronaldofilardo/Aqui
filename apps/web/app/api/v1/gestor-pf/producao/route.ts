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

  // Busca os IDs dos parceiros deste gestor para filtrar os procedimentos
  const parceirosDoGestor = await prisma.parceiro.findMany({
    where: { gestorPfId },
    select: { id: true },
  });
  
  const parceiroIds = parceirosDoGestor.map(p => p.id);

  const where: Record<string, unknown> = {
    parceiroId: parceiroIds.length > 0 ? { in: parceiroIds } : undefined,
  };

  if (status && status !== "TODOS") {
    where.statusComissao = status;
  }

  if (parceiroId) {
    where.parceiroId = parceiroId;
  }

  // Filtrar por mês de referência (baseado na dataReferencia, não no upload)
  if (mesReferencia) {
    const [ano, mes] = mesReferencia.split("-");
    const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
    const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
    where.dataReferencia = {
      gte: inicioMes,
      lte: fimMes,
    };
  }

  const [procedimentos, total, parceiros, mesesDisponiveis] = await Promise.all([
    prisma.procedimentoPF.findMany({
      where,
      include: {
        parceiro: { select: { id: true, nome: true, cpf: true } },
        indicado: { select: { id: true, nome: true, cpf: true } },
        comercial: { select: { id: true, nome: true, funcao: true } },
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
      where: {
        parceiroId: parceiroIds.length > 0 ? { in: parceiroIds } : undefined,
      },
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