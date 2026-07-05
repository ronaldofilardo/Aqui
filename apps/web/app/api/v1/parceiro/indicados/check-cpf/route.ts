import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireParceiroWithScope, ok, badRequest } from "@/lib/api-helpers";
import { validarCPF } from "@asa/shared";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireParceiroWithScope();
    if (error) return error;

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
      select: { id: true, nome: true },
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
      select: { id: true, nome: true },
    });

    if (ehCliente) {
      return ok({
        valid: false,
        message: "Este CPF já está vinculado a um parceiro",
      });
    }

    return ok({ valid: true, message: "CPF disponível" });
  } catch {
    return badRequest("Erro ao validar CPF");
  }
}
