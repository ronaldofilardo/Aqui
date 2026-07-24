import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@aqui/database";
import { validateInviteToken } from "@/lib/invite-token";
import { checkRateLimit, tooManyRequests, getClientIp } from "@/lib/rate-limit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

/**
 * POST /api/auth/estabelecimento/acesso-automatico
 *
 * Endpoint PÚBLICO — chamado pela página /acesso/[token] (sem sessão ativa).
 * Recebe apenas o inviteToken HMAC assinado pelo consultor.
 * A assinatura HMAC prova autorização — só o sistema pode gerar tokens válidos.
 *
 * Fluxo:
 * 1. Valida assinatura e expiração do inviteToken
 * 2. Localiza o Estabelecimento
 * 3. Cria ou reutiliza UsuarioEstabelecimento
 * 4. Gera novo PasswordResetToken (7 dias)
 * 5. Retorna o link de reset-senha
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (
    !checkRateLimit(`acesso-automatico:${ip}`, { max: 10, windowMs: 60_000 })
  ) {
    return tooManyRequests(60_000);
  }

  try {
    const body = await req.json();
    const { inviteToken } = body;

    if (!inviteToken || typeof inviteToken !== "string") {
      return NextResponse.json(
        { error: "Link de convite ausente" },
        { status: 400 },
      );
    }

    // Validar assinatura HMAC e expiração do invite token
    const tokenData = validateInviteToken(inviteToken);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Link de convite inválido ou expirado" },
        { status: 410 },
      );
    }

    const { estabelecimentoId } = tokenData;

    // Buscar dados do estabelecimento
    const estab = await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: {
        id: true,
        nomeFantasia: true,
        email: true,
        cnpj: true,
      },
    });

    if (!estab) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 },
      );
    }

    // Determinar email e nome do usuário
    const email =
      estab.email ||
      `acesso@${estab.nomeFantasia
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}.asa.com`;

    // Criar ou reutilizar UsuarioEstabelecimento
    let usuarioEstab = await prisma.usuarioEstabelecimento.findFirst({
      where: { estabelecimentoId },
      select: { id: true, email: true },
    });

    if (!usuarioEstab) {
      // Senha temporária baseada nos primeiros 5 dígitos do CNPJ
      const cnpjDigits = estab.cnpj ? estab.cnpj.replace(/\D/g, "") : "00000";
      const senhaTemp = cnpjDigits.substring(0, 5) || "00000";
      const senhaHash = await hash(senhaTemp, 12);

      usuarioEstab = await prisma.usuarioEstabelecimento.create({
        data: {
          estabelecimentoId,
          nome: estab.nomeFantasia,
          email,
          senhaHash,
          tipo: "PROPRIETARIO",
          ativo: true,
          senhaTemporaria: true,
        },
        select: { id: true, email: true },
      });
    }

    // Gerar novo PasswordResetToken (invalida tokens anteriores)
    const plainToken = generateResetToken();
    const tokenHash = hashToken(plainToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { usuarioEstabelecimentoId: usuarioEstab.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          usuarioEstabelecimentoId: usuarioEstab.id,
          token: tokenHash,
          expiresAt,
        },
      }),
    ]);

    const baseUrl = getBaseUrl(req);

    return NextResponse.json({
      link: `${baseUrl}/reset-senha?token=${plainToken}&type=USUARIO_ESTABELECIMENTO`,
      email: usuarioEstab.email,
      nomeFantasia: estab.nomeFantasia,
    });
  } catch (err) {
    console.error("[acesso-automatico] Erro:", err);
    return NextResponse.json(
      { error: "Erro ao processar acesso" },
      { status: 500 },
    );
  }
}
