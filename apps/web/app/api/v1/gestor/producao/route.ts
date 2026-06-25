import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireGestorWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireGestorWithScope();
  if (error) return error;

  const gestorId = session!.user.id;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mesReferencia = searchParams.get("mesReferencia");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status && status !== "TODOS") {
    where.status = status;
  }

  if (mesReferencia) {
    const [year, month] = mesReferencia.split("-").map(Number);
    where.anoReferencia = year;
    where.mesReferencia = month;
  }

  const [cupons, total, mesesDisponiveis] = await Promise.all([
    prisma.cupomImportado.findMany({
      where,
      select: {
        id: true,
        cupomConfigId: true,
        pacienteNome: true,
        pacienteCpf: true,
        campanha: true,
        descontoPercentual: true,
        consultaId: true,
        usadoEm: true,
        mesReferencia: true,
        anoReferencia: true,
        criadoEm: true,
        cupomConfig: {
          select: { codigoCupom: true },
        },
        consulta: {
          select: {
            id: true,
            dataAgendamento: true,
            dataRealizacao: true,
            status: true,
            valorPago: true,
          },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: limit,
      skip,
    }),
    prisma.cupomImportado.count({ where }),
    prisma.cupomImportado.findMany({
      where: {},
      select: {
        anoReferencia: true,
        mesReferencia: true,
      },
      distinct: ["anoReferencia", "mesReferencia"],
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" },
      ],
    }),
  ]);

  return ok({
    cupons,
    mesesDisponiveis: mesesDisponiveis.map((m) =>
      `${m.anoReferencia}-${String(m.mesReferencia).padStart(2, "0")}`
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}