import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { hash } from "bcryptjs";
import { requireGestor, ok, created, badRequest } from "@/lib/api-helpers";
import { criarConsultorSchema } from "@aqui/shared";
import { criarAuditLog } from "@/lib/audit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

export async function GET() {
  const { session, error } = await requireGestor();
  if (error) return error;

  const consultores = await prisma.consultor.findMany({
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          status: true,
        },
      },
      _count: { select: { estabelecimentos: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok(consultores);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireGestor();
  if (error) return error;

  const body = await req.json();
  const parsed = criarConsultorSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const {
    nome,
    email,
    cpf,
    telefone,
    pixChave,
    pixTipo,
    bancoNome,
    agencia,
    conta,
  } = parsed.data;

  const exists = await prisma.usuario.findUnique({ where: { email } });
  if (exists) {
    return badRequest("Não foi possível completar o cadastro");
  }

  if (cpf) {
    const cpfExists = await prisma.consultor.findUnique({
      where: { cpf: cpf.replace(/\D/g, "") },
    });
    if (cpfExists) {
      return badRequest("CPF já cadastrado");
    }
  }

  // Generate temporary password: first 5 digits of CPF
  const cpfDigits = cpf ? cpf.replace(/\D/g, "") : "12345";
  const senhaTemporaria = cpfDigits.substring(0, 5);
  const senhaHash = await hash(senhaTemporaria, 12);

  // Generate reset token for first access
  const token = generateResetToken();
  const tokenHash = hashToken(token);

  const result = await prisma.$transaction(async (tx: any) => {
    const usuario = await tx.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        tipo: "CONSULTOR",
        telefone,
        senhaTemporaria: true,
      },
    });

    const consultor = await tx.consultor.create({
      data: {
        usuarioId: usuario.id,
        cpf: cpf ? cpf.replace(/\D/g, "") : undefined,
        pixChave,
        pixTipo: pixTipo || null,
        bancoNome,
        agencia,
        conta,
      },
    });

    await tx.gestorConsultor.create({
      data: {
        gestorId: session!.user.id,
        consultorId: consultor.id,
      },
    });

    // Create password reset token for first access (valid 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await tx.passwordResetToken.create({
      data: {
        usuarioId: usuario.id,
        token: tokenHash,
        expiresAt,
      },
    });

    return { usuario, consultor, token };
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_CONSULTOR",
    entidade: "consultor",
    entidadeId: result.consultor.id,
    detalhes: { nome, email },
  });

  const baseUrl = getBaseUrl(req);

  return created({
    id: result.consultor.id,
    usuarioId: result.usuario.id,
    nome,
    email,
    link: `${baseUrl}/acesso/${result.token}`,
  });
}
