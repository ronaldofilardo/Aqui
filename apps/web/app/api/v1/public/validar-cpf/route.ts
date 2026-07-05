import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest } from "@/lib/api-helpers";
import { validarCPF } from "@asa/shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/public/validar-cpf?cpf=xxx
 * Endpoint público para validar se um CPF está disponível para ser cadastrado como cliente
 * Retorna erro se CPF já é parceiro ou já é cliente
 */
export async function GET(req: NextRequest) {
  try {
    const cpf = req.nextUrl.searchParams.get("cpf");
    if (!cpf) {
      return badRequest("CPF é obrigatório");
    }

    // Validate CPF format
    if (!validarCPF(cpf)) {
      return ok({ valid: false, message: "CPF inválido" });
    }

    const cpfDigits = cpf.replace(/\D/g, "");

    // Check if CPF is already a partner
    const ehParceiro = await prisma.parceiro.findUnique({
      where: { cpf: cpfDigits },
      select: { id: true },
    });

    if (ehParceiro) {
      return ok({
        valid: false,
        message: "Este CPF já é um parceiro no sistema",
      });
    }

    // Check if CPF already exists as client
    const ehCliente = await prisma.indicado.findUnique({
      where: { cpf: cpfDigits },
      select: { id: true },
    });

    if (ehCliente) {
      return ok({
        valid: false,
        message: "Este CPF já está vinculado como cliente",
      });
    }

    return ok({ valid: true, message: "CPF disponível" });
  } catch (error) {
    console.error("[validar-cpf] Error:", error);
    return badRequest("Erro ao validar CPF");
  }
}
