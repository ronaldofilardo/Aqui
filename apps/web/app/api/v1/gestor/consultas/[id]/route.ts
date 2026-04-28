import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest, notFound } from "@/lib/api-helpers";
import {
  atualizarConsultaSchema,
  COMISSAO_ESTABELECIMENTO,
  COMISSAO_CONSULTOR,
} from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireGestor();
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
      const now = new Date();

      await tx.comissao.create({
        data: {
          consultaId: id,
          estabelecimentoId: estab.id,
          consultorId: estab.consultorId,
          valorEstabelecimento: COMISSAO_ESTABELECIMENTO,
          valorConsultor: COMISSAO_CONSULTOR,
          mesReferencia: now.getMonth() + 1,
          anoReferencia: now.getFullYear(),
        },
      });

      // Update consultor totals
      await tx.consultor.update({
        where: { id: estab.consultorId },
        data: {
          totalConsultas: { increment: 1 },
          totalComissoes: { increment: COMISSAO_CONSULTOR },
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
