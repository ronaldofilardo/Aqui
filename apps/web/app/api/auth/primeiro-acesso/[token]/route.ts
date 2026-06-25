import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { badRequest, ok, notFound, created } from "@/lib/api-helpers";
import { hashToken, validatePasswordStrength } from "@/lib/password-reset";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return badRequest("Token é obrigatório");
  }

  const tokenHash = hashToken(token);

  const acesso = await prisma.primeiraAcss.findUnique({
    where: { token: tokenHash },
    include: {
      parceiro: {
        include: {
          gestorPf: { select: { nome: true } },
        },
      },
    },
  });

  if (!acesso) {
    return notFound("Token inválido");
  }

  if (acesso.revoked) {
    return badRequest("Este link já foi utilizado");
  }

  if (new Date() > acesso.expiresAt) {
    return badRequest("Este link expirou");
  }

  return ok({
    parceiroId: acesso.parceiroId,
    parceiroNome: acesso.parceiro.nome,
    gestorNome: acesso.parceiro.gestorPf.nome,
  });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return badRequest("Token é obrigatório");
  }

  const body = await req.json();
  const { senha, confirmarSenha } = body;

  if (!senha) {
    return badRequest("Senha é obrigatória");
  }

  if (senha !== confirmarSenha) {
    return badRequest("As senhas não coincidem");
  }

  const validation = validatePasswordStrength(senha);
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "));
  }

  const tokenHash = hashToken(token);

  const acesso = await prisma.primeiraAcss.findUnique({
    where: { token: tokenHash },
    include: {
      parceiro: true,
    },
  });

  if (!acesso) {
    return notFound("Token inválido");
  }

  if (acesso.revoked) {
    return badRequest("Este link já foi utilizado");
  }

  if (new Date() > acesso.expiresAt) {
    return badRequest("Este link expirou");
  }

  const senhaHash = await hash(senha, 12);

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: acesso.parceiro.usuarioId },
      data: {
        senhaHash,
        senhaTemporaria: false,
      },
    });

    await tx.primeiraAcss.update({
      where: { id: acesso.id },
      data: { revoked: true },
    });
  });

  return created({ message: "Senha definida com sucesso" });
}