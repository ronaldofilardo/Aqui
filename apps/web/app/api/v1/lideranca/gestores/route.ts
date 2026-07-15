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

const criarGestorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 caracteres"),
  telefone: z.string().optional(),
  percentualComissao: z.number().min(0).max(100).optional(),
});

export async function GET(req: NextRequest) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const gestores = await prisma.gestor.findMany({
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
    gestores.map((g) => ({
      id: g.id,
      nome: g.nome,
      email: g.usuario.email,
      cpf: g.cpf,
      percentualComissao: g.percentualComissao,
      status: g.usuario.status,
      totalParceiros: g._count.parceiros,
      createdAt: g.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  try {
    const { session, lideranca, error } = await requireLiderancaWithScope("GESTOR");
    if (error) return error;

    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const parsed = criarGestorSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ");
      return badRequest(messages);
    }

    const { nome, email, cpf, telefone, percentualComissao } = parsed.data;
    const cpfClean = cpf.replace(/\D/g, "");
    const percentualNum = percentualComissao || 0;

    const existsUsuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existsUsuario) {
      return badRequest("Email já cadastrado no sistema");
    }

    const existsCpf = await prisma.gestor.findUnique({
      where: { cpf: cpfClean },
    });
    if (existsCpf) {
      return badRequest("CPF já cadastrado como Gestor");
    }

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email: email.toLowerCase().trim(),
          senhaHash,
          tipo: "GESTOR",
          telefone: telefone || undefined,
          senhaTemporaria: true,
        },
      });

      const gestor = await tx.gestor.create({
        data: {
          usuarioId: usuario.id,
          nome,
          cpf: cpfClean,
          liderancaId: lideranca.id,
          percentualComissao: percentualNum,
          status: "ATIVO",
        },
      });

      return { usuario, gestor };
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "CRIAR_GESTOR",
      entidade: "gestor",
      entidadeId: result.gestor.id,
      detalhes: { nome, email, cpf: cpfClean, liderancaId: lideranca.id },
    });

    return created({
      id: result.gestor.id,
      usuarioId: result.usuario.id,
      nome,
      email: email.toLowerCase().trim(),
      cpf: cpfClean,
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error("[lideranca/gestores] Erro ao criar gestor:", err);
    return badRequest(err?.message || "Erro interno ao criar gestor");
  }
}