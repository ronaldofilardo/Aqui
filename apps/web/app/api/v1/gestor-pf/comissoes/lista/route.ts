import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireGestorPFWithScope } from "@/lib/api-helpers";

/**
 * GET /api/v1/gestor-pf/comissoes
 * 
 * Query params:
 * - status: CALCULADA | PAGA | TODOS
 * - mes: YYYY-MM (opcional)
 */
export async function GET(req: NextRequest) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "TODOS";
  const mes = searchParams.get("mes");

  const where: any = {
    comercial: {
      gestorPfId,
    },
  };

  if (status !== "TODOS") {
    where.status = status;
  }

  if (mes) {
    where.mesReferencia = mes;
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where,
    include: {
      comercial: {
        include: {
          usuario: {
            select: { nome: true, email: true },
          },
        },
      },
    },
    orderBy: { mesReferencia: "desc" },
    take: 100,
  });

  return ok(
    comissoes.map((c) => ({
      id: c.id,
      mesReferencia: c.mesReferencia,
      comercial: {
        id: c.comercial.id,
        nome: c.comercial.nome,
        email: c.comercial.usuario.email,
        funcao: c.comercial.funcao,
      },
      valorVendas: Number(c.valorVendas),
      valorComissao: Number(c.valorComissao),
      status: c.status,
      dataPagamento: c.dataPagamento,
    })),
  );
}