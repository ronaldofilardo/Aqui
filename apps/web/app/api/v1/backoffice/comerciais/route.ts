import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
  created,
  forbidden,
} from "@/lib/api-helpers";
import { z } from "zod";

const createComercialSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().length(11),
  email: z.string().email(),
  telefone: z.string().optional(),
  funcao: z.enum([
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
    "SUPERVISOR_FRANQUIA",
    "SUPERVISOR_ATENDIMENTO",
    "GERENTE_ATENDIMENTO",
    "SUPERVISOR_COMERCIAL",
  ]).optional(),
  lideranca: z.enum(["COMERCIAL", "GESTOR"]).optional(),
  percentualComissao: z.number().min(0).max(100),
});

export async function GET() {
  console.log("[comerciais GET] Iniciando requisição...");
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  console.log("[comerciais GET] Session:", session?.user?.email, "backofficeId:", backofficeId, "error:", error?.status);
  if (error) return error;

  // Buscar todas as lideranças deste backoffice
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    include: {
      comerciais: {
        include: {
          usuario: {
            select: { id: true, email: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Planificar todos os comerciais de todas as lideranças
  const comerciais = liderancas.flatMap(l => l.comerciais);

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
      liderancaId: c.liderancaId,
      tipoLideranca: c.tipoLideranca,
    })),
  );
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createComercialSchema.parse(body);

    // Verificar se já existe usuário com este email
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return badRequest("Já existe um usuário com este email");
    }

    // Verificar se já existe comercial com este CPF
    const existingComercial = await prisma.comercial.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingComercial) {
      return badRequest("Já existe um comercial com este CPF");
    }

    // Buscar a primeira liderança do tipo COMERCIAL para este backoffice
    // ou criar uma nova se não existir
    let lideranca = await prisma.lideranca.findFirst({
      where: { backofficeId, tipo: "COMERCIAL" },
    });

    if (!lideranca) {
      // Criar nova liderança tipo COMERCIAL
      const usuarioLideranca = await prisma.usuario.create({
        data: {
          nome: data.nome,
          email: data.email.toLowerCase(),
          senhaHash: "", // será definido no primeiro login
          tipo: "GESTOR",
          papel: "BACKOFFICE",
        },
      });

      lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuarioLideranca.id,
          nome: data.nome,
          cpf: data.cpf,
          backofficeId,
          tipo: "COMERCIAL",
        },
      });
    }

    // Criar usuário para o comercial
    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email.toLowerCase(),
        senhaHash: "",
        tipo: "COMERCIAL",
        telefone: data.telefone,
      },
    });

    // Criar comercial
    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: usuario.id,
        nome: data.nome,
        cpf: data.cpf,
        liderancaId: lideranca.id,
        percentualComissao: data.percentualComissao,
        funcao: data.funcao,
        tipoLideranca: data.lideranca,
      },
      include: {
        usuario: {
          select: { id: true, email: true, status: true },
        },
      },
    });

    return created({
      id: comercial.id,
      nome: comercial.nome,
      cpf: comercial.cpf,
      email: comercial.usuario.email,
      funcao: comercial.funcao,
      percentualComissao: comercial.percentualComissao,
      status: comercial.status,
      tipoLideranca: comercial.tipoLideranca,
    });
  } catch (e: any) {
    console.error("[comerciais POST] Erro:", e);
    if (e instanceof z.ZodError) {
      return badRequest("Dados inválidos");
    }
    return badRequest("Erro ao criar comercial");
  }
}


