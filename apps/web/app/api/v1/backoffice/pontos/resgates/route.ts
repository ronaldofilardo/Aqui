import { NextRequest } from "next/server";
import { requireBackofficeWithScope, badRequest, ok } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@asa/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const FilterSchema = z.object({
  status: z
    .enum([
      "SOLICITADO",
      "EM_ANALISE",
      "APROVADO",
      "REJEITADO",
      "ENTREGUE",
      "CANCELADO",
    ])
    .optional(),
  cicloPontosId: z.string().uuid().optional(),
  parceiroId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  // Rate limiting: 20 requisições por minuto
  const rateLimitResponse = await rateLimit(req, { limit: 20, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const cicloPontosId = searchParams.get("cicloPontosId");
    const parceiroId = searchParams.get("parceiroId");

    const validation = FilterSchema.safeParse({
      status: status || undefined,
      cicloPontosId: cicloPontosId || undefined,
      parceiroId: parceiroId || undefined,
    });

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    // Buscar ciclos do gestor
    const ciclos = await prisma.cicloPontos.findMany({
      where: { backofficeId },
      select: { id: true },
    });

    const cicloIds = ciclos.map((c) => c.id);

    const where: any = {
      cicloPontosId: { in: cicloIds },
    };

    if (validation.data.status) {
      where.status = validation.data.status;
    }

    if (validation.data.cicloPontosId) {
      where.cicloPontosId = validation.data.cicloPontosId;
    }

    if (validation.data.parceiroId) {
      where.parceiroId = validation.data.parceiroId;
    }

    const resgates = await prisma.solicitacaoResgate.findMany({
      where,
      include: {
        parceiro: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        premio: {
          select: {
            id: true,
            codigo: true,
            descricao: true,
            pontos: true,
          },
        },
        cicloPontos: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { solicitadoEm: "desc" },
    });

    return ok({
      resgates: resgates.map((r) => ({
        id: r.id,
        parceiro: {
          id: r.parceiro.id,
          nome: r.parceiro.nome,
          cpf: r.parceiro.cpf,
        },
        premio: {
          id: r.premio.id,
          codigo: r.premio.codigo,
          descricao: r.premio.descricao,
          pontos: r.premio.pontos,
        },
        cicloPontos: {
          id: r.cicloPontos.id,
          nome: r.cicloPontos.nome,
        },
        pontosDebitados: r.pontosDebitados,
        status: r.status,
        solicitadoEm: r.solicitadoEm.toISOString(),
        processadoEm: r.processadoEm?.toISOString(),
        entregueEm: r.entregueEm?.toISOString(),
        canceladoEm: r.canceladoEm?.toISOString(),
        observacao: r.observacao,
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar resgates:", err);
    return badRequest("Erro ao buscar resgates");
  }
}

