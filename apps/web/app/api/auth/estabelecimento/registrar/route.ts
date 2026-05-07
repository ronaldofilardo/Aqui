import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@asa/database";
import { badRequest } from "@/lib/api-helpers";
import { validateInviteToken } from "@/lib/invite-token";
import { checkRateLimit, tooManyRequests, getClientIp } from "@/lib/rate-limit";
import { generateResetToken, hashToken } from "@/lib/password-reset";

export async function POST(req: NextRequest) {
  // Rate limiting: 5 registrations per minute per IP
  const ip = getClientIp(req);
  if (!checkRateLimit(`registrar:${ip}`, { max: 5, windowMs: 60_000 })) {
    return tooManyRequests(60_000);
  }

  try {
    const body = await req.json();
    const { email, nome, inviteToken } = body;

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

    if (!email || !nome) {
      return badRequest("Campos obrigatórios: email, nome");
    }

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return badRequest("Email inválido");
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

    // Generate temporary password: first 5 digits of CNPJ
    const cnpjDigits = estabelecimento.cnpj
      ? estabelecimento.cnpj.replace(/\D/g, "")
      : "12345";
    const senhaTemporaria = cnpjDigits.substring(0, 5);
    const senhaHash = await hash(senhaTemporaria, 12);

    // Generate reset token for first access
    const token = generateResetToken();
    const tokenHash = hashToken(token);

    const usuario = await prisma.$transaction(async (tx: any) => {
      const user = await tx.usuarioEstabelecimento.create({
        data: {
          estabelecimentoId,
          nome,
          email,
          senhaHash,
          tipo: "PROPRIETARIO",
          ativo: true,
          senhaTemporaria: true,
        },
      });

      // Create password reset token for first access (valid 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await tx.passwordResetToken.create({
        data: {
          usuarioEstabelecimentoId: user.id,
          token: tokenHash,
          expiresAt,
        },
      });

      return { ...user, token };
    });

    return NextResponse.json(
      {
        success: true,
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        link: `/reset-senha?token=${usuario.token}&type=USUARIO_ESTABELECIMENTO`,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Erro ao registrar estabelecimento:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
