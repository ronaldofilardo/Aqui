import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  forbidden,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { criarAuditLog } from "@/lib/audit";
import { z } from "zod";

const criarLiderancaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 caracteres"),
  telefone: z.string().optional(),
  tipo: z.enum(["COMERCIAL", "GESTOR"], {
    errorMap: () => ({ message: "Tipo deve ser COMERCIAL ou GESTOR" }),
  }),
});

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { backofficeId };

  if (tipo) {
    where.tipo = tipo;
  }

  if (status) {
    where.status = status;
  }

  const liderancas = await prisma.lideranca.findMany({
    where,
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
      _count: {
        select: {
          comerciais: true,
          gestores: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    liderancas.map((l) => ({
      id: l.id,
      nome: l.nome,
      email: l.usuario.email,
      cpf: l.cpf,
      tipo: l.tipo,
      status: l.status,
      totalComerciais: l._count.comerciais,
      totalGestores: l._count.gestores,
      createdAt: l.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const parsed = criarLiderancaSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ");
      return badRequest(messages);
    }

    const { nome, email, cpf, telefone, tipo } = parsed.data;
    const cpfClean = cpf.replace(/\D/g, "");

    const existsUsuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existsUsuario) {
      return badRequest("Email já cadastrado no sistema");
    }

    const existsCpf = await prisma.lideranca.findUnique({
      where: { cpf: cpfClean },
    });
    if (existsCpf) {
      return badRequest("CPF já cadastrado como Liderança");
    }

    const backoffice = await prisma.backoffice.findUnique({
      where: { id: backofficeId! },
    });
    if (!backoffice) {
      return forbidden();
    }

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email: email.toLowerCase().trim(),
          senhaHash,
          tipo: "LIDERANCA",
          telefone: telefone || undefined,
          senhaTemporaria: true,
        },
      });

      const lideranca = await tx.lideranca.create({
        data: {
          usuarioId: usuario.id,
          nome,
          cpf: cpfClean,
          tipo,
          backofficeId: backofficeId!,
          status: "ATIVO",
        },
      });

      return { usuario, lideranca };
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "CRIAR_LIDERANCA",
      entidade: "lideranca",
      entidadeId: result.lideranca.id,
      detalhes: { nome, email, cpf: cpfClean, tipo },
    });

    return created({
      id: result.lideranca.id,
      usuarioId: result.usuario.id,
      nome,
      email: email.toLowerCase().trim(),
      cpf: cpfClean,
      tipo: result.lideranca.tipo,
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error("[liderancas] Erro ao criar liderança:", err);
    return badRequest(err?.message || "Erro interno ao criar liderança");
  }
}
