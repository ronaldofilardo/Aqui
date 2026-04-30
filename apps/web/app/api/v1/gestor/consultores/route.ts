import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { requireGestor, ok, created, badRequest } from "@/lib/api-helpers";
import { criarConsultorSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

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
    senha,
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

  const senhaHash = await hash(senha, 12);

  const result = await prisma.$transaction(async (tx: any) => {
    const usuario = await tx.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        tipo: "CONSULTOR",
        telefone,
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

    return { usuario, consultor };
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_CONSULTOR",
    entidade: "consultor",
    entidadeId: result.consultor.id,
    detalhes: { nome, email },
  });

  return created({
    id: result.consultor.id,
    usuarioId: result.usuario.id,
    nome,
    email,
  });
}
