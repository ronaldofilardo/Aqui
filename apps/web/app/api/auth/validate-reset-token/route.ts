import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hashToken, isTokenExpired } from "@/lib/password-reset";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (
      !token ||
      !type ||
      !["USUARIO", "USUARIO_ESTABELECIMENTO"].includes(type)
    ) {
      return NextResponse.json(
        { valid: false, error: "Token ou tipo inválido" },
        { status: 400 },
      );
    }

    const hashedToken = hashToken(token);

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: {
        usuario: {
          select: { id: true, email: true, nome: true },
        },
        usuarioEstabelecimento: {
          select: { id: true, email: true, nome: true },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: "Token inválido ou expirado",
      });
    }

    // Check if token is expired
    if (isTokenExpired(resetToken.expiresAt)) {
      return NextResponse.json({
        valid: false,
        error: "Token expirado",
      });
    }

    // Check if token type matches
    if (type === "USUARIO" && !resetToken.usuarioId) {
      return NextResponse.json({
        valid: false,
        error: "Tipo de token não corresponde",
      });
    }

    if (
      type === "USUARIO_ESTABELECIMENTO" &&
      !resetToken.usuarioEstabelecimentoId
    ) {
      return NextResponse.json({
        valid: false,
        error: "Tipo de token não corresponde",
      });
    }

    const userData =
      type === "USUARIO"
        ? resetToken.usuario
        : resetToken.usuarioEstabelecimento;

    return NextResponse.json({
      valid: true,
      email: userData?.email,
      nome: userData?.nome,
      usuarioId: userData?.id,
      type,
    });
  } catch (error) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Erro ao validar token",
      },
      { status: 500 },
    );
  }
}
