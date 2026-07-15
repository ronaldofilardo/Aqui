import { NextRequest } from "next/server";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { calcularComissaoComercial } from "@/lib/pontos-utils";

/**
 * POST /api/v1/backoffice/comerciais/calcular-comissao
 * 
 * Simula o cálculo de comissão para um comercial com base nas regras.
 * Útil para preview/validação antes de processar upload.
 * 
 * Body:
 * {
 *   comercialId: string;
 *   valorProcedimento: number;
 *   dataReferencia: string; // YYYY-MM-DD
 *   tipoProcedimento?: string;
 * }
 */
export async function POST(req: NextRequest) {
  const { error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  const {
    comercialId,
    valorProcedimento,
    dataReferencia,
    tipoProcedimento,
  } = body;

  if (!comercialId || !valorProcedimento || !dataReferencia) {
    return badRequest(
      "Campos obrigatórios: comercialId, valorProcedimento, dataReferencia",
    );
  }

  try {
    const resultado = await calcularComissaoComercial({
      comercialId,
      valorProcedimento: Number(valorProcedimento),
      dataReferencia: new Date(dataReferencia),
      tipoProcedimento,
    });

    return ok({
      ...resultado,
      valorProcedimento: Number(valorProcedimento),
      dataReferencia,
    });
  } catch (err: any) {
    return badRequest(err?.message || "Erro ao calcular comissão");
  }
}
