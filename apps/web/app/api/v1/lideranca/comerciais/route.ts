import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  forbidden,
  ok,
  requireLiderancaWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { criarAuditLog } from "@/lib/audit";
import { z } from "zod";

const criarComercialSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 caracteres"),
  telefone: z.string().optional(),
  percentualComissao: z.number().min(0).max(100).optional(),
  funcao: z.enum([
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
    "SUPERVISOR_FRANQUIA",
    "SUPERVISOR_ATENDIMENTO",
    "GERENTE_ATENDIMENTO",
    "SUPERVISOR_COMERCIAL",
  ]).optional(),
});

export async function GET(req: NextRequest) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const comerciais = await prisma.comercial.findMany({
    where: { liderancaId: lideranca.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
      _count: {
        select: { parceiros: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    comerciais.map((c) => ({
      id: c.id,
      nome: c.nome,
      email: c.usuario.email,
      cpf: c.cpf,
      funcao: c.funcao,
      percentualComissao: c.percentualComissao,
      status: c.usuario.status,
      totalParceiros: c._count.parceiros,
      createdAt: c.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  try {
    const { session, lideranca, backofficeId, error } = await requireLiderancaWithScope("COMERCIAL");
    if (error) return error;

    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const parsed = criarComercialSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ");
      return badRequest(messages);
    }

    const { nome, email, cpf, telefone, percentualComissao, funcao } = parsed.data;
    const cpfClean = cpf.replace(/\D/g, "");
    const percentualNum = percentualComissao || 0;

    const existsUsuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existsUsuario) {
      return badRequest("Email já cadastrado no sistema");
    }

    const existsCpf = await prisma.comercial.findUnique({
      where: { cpf: cpfClean },
    });
    if (existsCpf) {
      return badRequest("CPF já cadastrado como Comercial");
    }

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email: email.toLowerCase().trim(),
          senhaHash,
          tipo: "COMERCIAL",
          telefone: telefone || undefined,
          senhaTemporaria: true,
        },
      });

      const comercial = await tx.comercial.create({
        data: {
          usuarioId: usuario.id,
          nome,
          cpf: cpfClean,
          liderancaId: lideranca.id,
          percentualComissao: percentualNum,
          funcao: funcao || null,
          status: "ATIVO",
        },
      });

      return { usuario, comercial };
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "CRIAR_COMERCIAL",
      entidade: "comercial",
      entidadeId: result.comercial.id,
      detalhes: { nome, email, cpf: cpfClean, liderancaId: lideranca.id },
    });

    return created({
      id: result.comercial.id,
      usuarioId: result.usuario.id,
      nome,
      email: email.toLowerCase().trim(),
      cpf: cpfClean,
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error("[lideranca/comerciais] Erro ao criar comercial:", err);
    return badRequest(err?.message || "Erro interno ao criar comercial");
  }
}