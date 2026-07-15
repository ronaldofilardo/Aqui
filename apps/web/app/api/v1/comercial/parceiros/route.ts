import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  forbidden,
  ok,
  requireComercialWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { criarAuditLog } from "@/lib/audit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";
import { z } from "zod";

const criarParceiroSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 caracteres"),
  pixChave: z.string().optional(),
  telefone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { session, comercial, error } = await requireComercialWithScope();
  if (error) return error;

  const parceiros = await prisma.parceiro.findMany({
    where: { comercialId: comercial.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
      indicacoes: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { indicacoes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    parceiros.map((p) => ({
      id: p.id,
      nome: p.nome,
      cpf: p.cpf,
      email: p.usuario.email,
      pixChave: p.pixChave,
      status: p.status,
      totalIndicados: p._count.indicacoes,
      createdAt: p.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  try {
    const { session, comercial, error } = await requireComercialWithScope();
    if (error) return error;

    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const parsed = criarParceiroSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ");
      return badRequest(messages);
    }

    const { nome, email, cpf, pixChave, telefone } = parsed.data;
    const cpfClean = cpf.replace(/\D/g, "");

    const existsUsuario = await prisma.usuario.findUnique({
      where: { email },
    });
    if (existsUsuario) {
      return badRequest("Email já cadastrado no sistema");
    }

    const existsCpf = await prisma.parceiro.findUnique({
      where: { cpf: cpfClean },
    });
    if (existsCpf) {
      return badRequest("CPF já cadastrado como parceiro");
    }

    const cpfEhCliente = await prisma.indicado.findUnique({
      where: { cpf: cpfClean },
    });
    if (cpfEhCliente) {
      return badRequest(
        "Este CPF já é um cliente no sistema e não pode ser cadastrado como parceiro.",
      );
    }

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const token = generateResetToken();
    const tokenHash = hashToken(token);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
          tipo: "PARCEIRO",
          telefone,
          senhaTemporaria: true,
        },
      });

      const parceiro = await tx.parceiro.create({
        data: {
          usuarioId: usuario.id,
          nome,
          cpf: cpfClean,
          pixChave,
          status: "ATIVO",
          comercialId: comercial.id,
        },
      });

      await tx.primeiraAcss.create({
        data: {
          token: tokenHash,
          parceiroId: parceiro.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { usuario, parceiro, token };
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "CRIAR_PARCEIRO",
      entidade: "parceiro",
      entidadeId: result.parceiro.id,
      detalhes: { nome, email, cpf: cpfClean, comercialId: comercial.id },
    });

    const baseUrl = getBaseUrl(req);

    return created({
      id: result.parceiro.id,
      usuarioId: result.usuario.id,
      nome,
      email,
      cpf: cpfClean,
      link: `${baseUrl}/acesso/${result.token}`,
    });
  } catch (err: any) {
    console.error("[comercial/parceiros] Erro ao criar parceiro:", err);
    return badRequest(err?.message || "Erro interno ao criar parceiro");
  }
}