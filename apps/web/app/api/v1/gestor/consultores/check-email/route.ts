import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireGestor();
    if (error) return error;

    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return badRequest("Email é obrigatório");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ok({ valid: false, message: "Email inválido" });
    }

    // Check if email already exists
    const exists = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (exists) {
      return ok({ valid: false, message: "Email já cadastrado" });
    }

    return ok({ valid: true, message: "Email disponível" });
  } catch {
    return badRequest("Erro ao validar email");
  }
}
