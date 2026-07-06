import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  forbidden,
  ok,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { criarComercialSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET() {
  console.log("[comerciais GET] Iniciando requisição...");
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  console.log("[comerciais GET] Session:", session?.user?.email, "gestorPfId:", gestorPfId, "error:", error?.status);
  if (error) return error;

  const comerciais = await prisma.comercial.findMany({
    where: { gestorPfId },
    include: {
      usuario: {
        select: { id: true, email: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    comerciais.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      funcao: c.funcao,
      percentualComissao: c.percentualComissao,
      status: c.status,
      createdAt: c.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  console.log("[comerciais POST] Iniciando requisição...");
  try {
    const { session, gestorPfId, error } = await requireGestorPFWithScope();
    console.log("[comerciais POST] Session:", session?.user?.email, "gestorPfId:", gestorPfId, "error:", error?.status);
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
    const percentualNum =
      typeof percentualComissao === "string"
        ? parseFloat(percentualComissao)
        : percentualComissao;

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

    const gestorPf = await prisma.gestorPF.findUnique({
      where: { id: gestorPfId! },
    });
    if (!gestorPf) {
      return forbidden();
    }

    const senhaTemporaria = cpfClean.substring(0, 5);
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
          percentualComissao: percentualNum,
          funcao: funcao || null,
          status: "ATIVO",
          gestorPfId: gestorPfId!,
        },
      });

      return { usuario, comercial };
    });

    try {
      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "CRIAR_COMERCIAL",
        entidade: "comercial",
        entidadeId: result.comercial.id,
        detalhes: { nome, email, cpf: cpfClean },
      });
    } catch (auditErr) {
      // Não interrompe a resposta por falha no audit log
      console.error("[comerciais] Erro ao criar audit log:", auditErr);
    }

    return created({
      id: result.comercial.id,
      usuarioId: result.usuario.id,
      nome,
      email: email.toLowerCase().trim(),
      cpf: cpfClean,
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error("[comerciais] Erro ao criar comercial:", err);
    return badRequest(err?.message || "Erro interno ao criar comercial");
  }
}
