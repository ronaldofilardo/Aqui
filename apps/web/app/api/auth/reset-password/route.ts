import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import {
  hashToken,
  isTokenExpired,
  validatePasswordStrength,
} from "@/lib/password-reset";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, type, novaSenha } = await request.json();

    if (!token || !type || !novaSenha) {
      return NextResponse.json(
        { error: "Token, tipo e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(novaSenha);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: "Senha fraca",
          errors: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    const hashedToken = hashToken(token);

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: {
        usuario: {
          select: { id: true },
        },
        usuarioEstabelecimento: {
          select: { id: true },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    }

    // Check if token is expired
    if (isTokenExpired(resetToken.expiresAt)) {
      return NextResponse.json({ error: "Token expirado" }, { status: 410 });
    }

    // Hash the new password
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Update password based on type
    if (type === "USUARIO" && resetToken.usuarioId) {
      await prisma.usuario.update({
        where: { id: resetToken.usuarioId },
        data: { senhaHash, senhaTemporaria: false },
      });
    } else if (
      type === "USUARIO_ESTABELECIMENTO" &&
      resetToken.usuarioEstabelecimentoId
    ) {
      await prisma.usuarioEstabelecimento.update({
        where: { id: resetToken.usuarioEstabelecimentoId },
        data: { senhaHash, senhaTemporaria: false },
      });
    } else {
      return NextResponse.json(
        { error: "Tipo de token não corresponde" },
        { status: 400 },
      );
    }

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao redefinir senha",
      },
      { status: 500 },
    );
  }
}
