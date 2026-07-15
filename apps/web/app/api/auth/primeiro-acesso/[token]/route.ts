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
          comercial: { 
            select: { 
              nome: true,
              lideranca: {
                select: { 
                  usuario: { select: { nome: true } }
                }
              }
            } 
          },
          gestor: {
            select: {
              nome: true,
              lideranca: {
                select: { 
                  usuario: { select: { nome: true } }
                }
              }
            }
          },
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

  if (!acesso.parceiro) {
    return notFound("Parceiro não encontrado");
  }

  // Obter nome do gestor-pf através do comercial ou gestor
  let gestorNome: string | null = null;
  if (acesso.parceiro.comercial && acesso.parceiro.comercial.lideranca) {
    gestorNome = acesso.parceiro.comercial.lideranca.usuario.nome;
  } else if (acesso.parceiro.gestor && acesso.parceiro.gestor.lideranca) {
    gestorNome = acesso.parceiro.gestor.lideranca.usuario.nome;
  }

  return ok({
    parceiroId: acesso.parceiroId,
    parceiroNome: acesso.parceiro.nome,
    gestorNome: gestorNome || "Não disponível",
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

  if (!acesso.parceiro || !acesso.parceiro.usuarioId) {
    return notFound("Parceiro não encontrado");
  }

  const senhaHash = await hash(senha, 12);

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: acesso.parceiro!.usuarioId! },
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