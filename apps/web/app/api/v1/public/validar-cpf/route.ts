import { NextRequest } from "next/server";
import { ok, badRequest } from "@/lib/api-helpers";
import { validarCPF } from "@aqui/shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/public/validar-cpf?cpf=xxx
 * Endpoint publico para validar formato de CPF.
 * No AQUI nao ha parceiros/indicados - apenas consultor (ver /gestor/consultores/check-cpf).
 */
export async function GET(req: NextRequest) {
  try {
    const cpf = req.nextUrl.searchParams.get("cpf");
    if (!cpf) {
      return badRequest("CPF e obrigatorio");
    }

    if (!validarCPF(cpf)) {
      return ok({ valid: false, message: "CPF invalido" });
    }

    return ok({ valid: true, message: "CPF disponivel" });
  } catch (error) {
    console.error("[validar-cpf] Error:", error);
    return badRequest("Erro ao validar CPF");
  }
}
