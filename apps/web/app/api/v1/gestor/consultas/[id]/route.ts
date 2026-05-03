import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  requireGestorWithScope,
  ok,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/api-helpers";
import {
  atualizarConsultaSchema,
} from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = atualizarConsultaSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const consulta = await prisma.consulta.findUnique({
    where: { id },
    include: {
      cupomImportado: {
        include: {
          cupomConfig: {
            include: {
              estabelecimento: { include: { consultor: true } },
            },
          },
        },
      },
    },
  });

  if (!consulta) return notFound("Consulta não encontrada");

  const estabConsultorId =
    consulta.cupomImportado.cupomConfig.estabelecimento.consultorId;
  if (!consultorIds.includes(estabConsultorId)) {
    return forbidden();
  }

  const { status, valorPago } = parsed.data;

  await prisma.$transaction(async (tx: any) => {
    await tx.consulta.update({
      where: { id },
      data: {
        status,
        ...(status === "REALIZADA" && { dataRealizacao: new Date() }),
        ...(valorPago && { valorPago }),
      },
    });

    if (status === "REALIZADA") {
      const estab = consulta.cupomImportado.cupomConfig.estabelecimento;

      // Update consultor totals
      await tx.consultor.update({
        where: { id: estab.consultorId },
        data: {
          totalConsultas: { increment: 1 },
        },
      });
    }

    if (status === "CANCELADA") {
      // Revert cupom to available
      await tx.cupomImportado.update({
        where: { id: consulta.cupomImportadoId },
        data: {
          status: "DISPONIVEL",
          consultaId: null,
          usadoEm: null,
        },
      });
    }
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_CONSULTA",
    entidade: "consulta",
    entidadeId: id,
    detalhes: { status },
  });

  return ok({ success: true });
}
