import { prisma, Prisma } from "@asa/database";

export async function criarAuditLog(params: {
  usuarioId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
}) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    usuarioId: params.usuarioId || null,
    acao: params.acao,
    entidade: params.entidade,
    entidadeId: params.entidadeId || null,
  };
  
  if (params.detalhes !== undefined) {
    data.detalhes = params.detalhes as any;
  }
  
  await prisma.auditLog.create({ data });
}
