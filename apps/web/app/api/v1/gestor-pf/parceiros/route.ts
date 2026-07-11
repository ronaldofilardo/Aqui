import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  getSession,
  notFound,
  ok,
  forbidden,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { criarParceiroSchema, atualizarParceiroSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";
import { generateResetToken, hashToken } from "@/lib/password-reset";
import { getBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  // Buscar todas as lideranças deste Gestor PF
  const liderancas = await prisma.lideranca.findMany({
    where: { gestorPfId },
    include: {
      comerciais: { select: { id: true } },
      gestores: { select: { id: true } },
    },
  });

  // Coletar todos os IDs de comerciais e gestores
  const comercialIds = liderancas.flatMap(l => l.comerciais.map(c => c.id));
  const gestorIds = liderancas.flatMap(l => l.gestores.map(g => g.id));

  // Buscar TODOS os parceiros: vinculados a comerciais/gestores OU sem vínculo (órfãos)
  const parceiros = await prisma.parceiro.findMany({
    where: {
      OR: [
        { comercialId: { in: comercialIds } },
        { gestorId: { in: gestorIds } },
        { comercialId: null, gestorId: null }, // Parceiros órfãos
      ],
    },
    include: {
      usuario: {
        select: {
          id: true,
          email: true,
          status: true,
        },
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

  const result = parceiros.map((p) => ({
    id: p.id,
    nome: p.nome,
    cpf: p.cpf,
    email: p.usuario.email,
    pixChave: p.pixChave,
    periodicidadeCicloEscolhida: p.periodicidadeCicloEscolhida,
    status: p.status,
    totalIndicados: p._count.indicacoes,
    desligadoEm: p.desligadoEm,
    createdAt: p.createdAt,
    indicacoes: p.indicacoes.map((i) => ({
      id: i.id,
      nome: i.nome,
      cpf: i.cpf,
      telefone: i.telefone,
      status: i.status,
      createdAt: i.createdAt,
    })),
  }));

  return ok(result);
}
