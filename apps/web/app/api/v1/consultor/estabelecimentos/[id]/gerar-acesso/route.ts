import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@aqui/database";
import { requireConsultor, ok, badRequest } from "@/lib/api-helpers";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const { id: estabId } = await params;

  try {
    // Verify estabelecimento belongs to this consultor
    const estab = await prisma.estabelecimento.findUnique({
      where: { id: estabId },
      select: {
        id: true,
        nomeFantasia: true,
        cnpj: true,
        email: true,
        consultorId: true,
      },
    });

    if (!estab) {
      return badRequest("Estabelecimento não encontrado");
    }

    if (estab.consultorId !== session!.user.consultorId) {
      return badRequest("Acesso negado");
    }

    // Check if UsuarioEstabelecimento already exists
    let usuarioEstab = await prisma.usuarioEstabelecimento.findFirst({
      where: { estabelecimentoId: estabId },
      select: { id: true, email: true, senhaTemporaria: true },
    });

    // If doesn't exist, create one
    if (!usuarioEstab) {
      // Use email from estabelecimento or generate a default one
      const email =
        estab.email ||
        `acesso@${estab.nomeFantasia.toLowerCase().replace(/\s+/g, "-")}.com`;

      // Generate temporary password: first 5 digits of CNPJ
      const cnpjDigits = estab.cnpj
        ? estab.cnpj.replace(/\D/g, "")
        : estab.nomeFantasia.substring(0, 5);
      const senhaTemporaria = cnpjDigits.substring(0, 5);
      const senhaHash = await hash(senhaTemporaria, 12);

      usuarioEstab = await prisma.usuarioEstabelecimento.create({
        data: {
          estabelecimentoId: estabId,
          nome: estab.nomeFantasia,
          email,
          senhaHash,
          tipo: "PROPRIETARIO",
          ativo: true,
          senhaTemporaria: true,
        },
        select: { id: true, email: true, senhaTemporaria: true },
      });
    }

    // Generate reset token
    const token = generateResetToken();
    const tokenHash = hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update password reset token
    await prisma.passwordResetToken.deleteMany({
      where: { usuarioEstabelecimentoId: usuarioEstab.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        usuarioEstabelecimentoId: usuarioEstab.id,
        token: tokenHash,
        expiresAt,
      },
    });

    const baseUrl = getBaseUrl(req);
    const resetLink = `${baseUrl}/reset-senha?token=${token}&type=USUARIO_ESTABELECIMENTO`;

    return ok({
      success: true,
      email: usuarioEstab.email,
      nomeFantasia: estab.nomeFantasia,
      link: resetLink,
    });
  } catch (err) {
    console.error("[gerar-acesso-estab] Erro:", err);
    return NextResponse.json(
      { error: "Erro ao gerar link de acesso" },
      { status: 500 },
    );
  }
}
