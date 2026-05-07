import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import {
  generateResetToken,
  hashToken,
  getTokenExpirationTime,
} from "@/lib/password-reset";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate admin access
    await requireAdmin();

    const { userType } = await request.json();

    if (
      !userType ||
      !["USUARIO", "USUARIO_ESTABELECIMENTO"].includes(userType)
    ) {
      return NextResponse.json(
        { error: "Tipo de usuário inválido" },
        { status: 400 },
      );
    }

    const userId = params.id;
    let usuario: any;

    // Validate user exists and belongs to correct type
    if (userType === "USUARIO") {
      usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, email: true, nome: true },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 },
        );
      }

      // Only admins can reset other users' passwords
      if (usuario.tipo !== "CONSULTOR") {
        return NextResponse.json(
          { error: "Permissão negada" },
          { status: 403 },
        );
      }
    } else if (userType === "USUARIO_ESTABELECIMENTO") {
      usuario = await prisma.usuarioEstabelecimento.findUnique({
        where: { id: userId },
        select: { id: true, email: true, nome: true },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "Usuário estabelecimento não encontrado" },
          { status: 404 },
        );
      }
    }

    // Generate reset token
    const token = generateResetToken();
    const hashedToken = hashToken(token);
    const expiresAt = getTokenExpirationTime();

    // Create password reset token in database
    if (userType === "USUARIO") {
      await prisma.passwordResetToken.create({
        data: {
          usuarioId: userId,
          token: hashedToken,
          expiresAt,
        },
      });
    } else {
      await prisma.passwordResetToken.create({
        data: {
          usuarioEstabelecimentoId: userId,
          token: hashedToken,
          expiresAt,
        },
      });
    }

    // Generate reset link
    const resetLink = `/reset-senha?token=${token}&type=${userType}`;

    return NextResponse.json({
      success: true,
      resetLink,
      email: usuario.email,
      nome: usuario.nome,
      expiresIn: "24 horas",
    });
  } catch (error) {
    console.error("Error generating reset token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar link de reset",
      },
      { status: 500 },
    );
  }
}
