import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { requireGestor, ok, badRequest } from "@/lib/api-helpers";
import { validarCPF } from "@aqui/shared";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireGestor();
    if (error) return error;

    const cpf = req.nextUrl.searchParams.get("cpf");
    if (!cpf) {
      return badRequest("CPF é obrigatório");
    }

    // Validate CPF format
    if (!validarCPF(cpf)) {
      return ok({ valid: false, message: "CPF inválido" });
    }

    // Check if CPF already exists
    const cpfDigits = cpf.replace(/\D/g, "");
    const exists = await prisma.consultor.findUnique({
      where: { cpf: cpfDigits },
      select: { id: true },
    });

    if (exists) {
      return ok({ valid: false, message: "CPF já cadastrado" });
    }

    return ok({ valid: true, message: "CPF disponível" });
  } catch {
    return badRequest("Erro ao validar CPF");
  }
}
