import { prisma, Prisma } from "@asa/database";

export async function criarAuditLog(params: {
  usuarioId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      usuarioId: params.usuarioId || null,
      acao: params.acao,
      entidade: params.entidade,
      entidadeId: params.entidadeId || null,
      detalhes: params.detalhes ?? undefined,
    },
  });
}
