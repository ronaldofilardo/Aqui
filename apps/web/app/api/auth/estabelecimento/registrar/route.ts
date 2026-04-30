import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@asa/database";
import { badRequest } from "@/lib/api-helpers";
import { validateInviteToken } from "@/lib/invite-token";
import { checkRateLimit, tooManyRequests, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limiting: 5 registrations per minute per IP
  const ip = getClientIp(req);
  if (!checkRateLimit(`registrar:${ip}`, { max: 5, windowMs: 60_000 })) {
    return tooManyRequests(60_000);
  }

  try {
    const body = await req.json();
    const { email, senha, nome, inviteToken } = body;

    // Validate invite token first — prevents enumeration of estabelecimentoIds
    if (!inviteToken || typeof inviteToken !== "string") {
      return NextResponse.json(
        { error: "Link de convite inválido ou ausente" },
        { status: 401 },
      );
    }

    const tokenData = validateInviteToken(inviteToken);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Link de convite inválido ou expirado" },
        { status: 401 },
      );
    }

    const { estabelecimentoId } = tokenData;

    if (!email || !senha || !nome) {
      return badRequest("Campos obrigatórios: email, senha, nome");
    }

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return badRequest("Email inválido");
    }

    if (typeof senha !== "string" || senha.length < 6) {
      return badRequest("Senha deve ter no mínimo 6 caracteres");
    }

    // Verificar estabelecimento existe
    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
    });
    if (!estabelecimento) {
      return badRequest("Estabelecimento não encontrado");
    }

    // Verificar email único
    const existente = await prisma.usuarioEstabelecimento.findUnique({
      where: { email },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Não foi possível completar o cadastro" },
        { status: 400 },
      );
    }

    const senhaHash = await hash(senha, 12);

    const usuario = await prisma.usuarioEstabelecimento.create({
      data: {
        estabelecimentoId,
        nome,
        email,
        senhaHash,
        tipo: "PROPRIETARIO",
        ativo: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
