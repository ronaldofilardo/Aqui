import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestorWithUserScope, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, usuarioIds } = await requireGestorWithUserScope();
  if (error) return error;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const acao = url.searchParams.get("acao") || undefined;
  const entidade = url.searchParams.get("entidade") || undefined;

  const where: Record<string, unknown> = {};
  if (usuarioIds.length > 0) where.usuarioId = { in: usuarioIds };
  if (acao) where.acao = acao;
  if (entidade) where.entidade = entidade;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { usuario: { select: { nome: true, email: true } } },
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return ok({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
