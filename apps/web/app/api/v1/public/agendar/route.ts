import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, notFound } from "@/lib/api-helpers";
import { agendarConsultaSchema } from "@asa/shared";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = agendarConsultaSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { codigoCupom, dataAgendamento } = parsed.data;

  const cupomConfig = await prisma.cupomConfig.findUnique({
    where: { codigoCupom },
  });

  if (!cupomConfig || cupomConfig.status !== "ATIVO") {
    return notFound("Cupom não encontrado ou inativo");
  }

  // Find available imported coupon
  const cupomImportado = await prisma.cupomImportado.findFirst({
    where: {
      cupomConfigId: cupomConfig.id,
      status: "DISPONIVEL",
    },
    orderBy: { criadoEm: "asc" },
  });

  if (!cupomImportado) {
    return badRequest("Nenhum cupom disponível para este código");
  }

  // Create consultation and mark coupon as used in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const consulta = await tx.consulta.create({
      data: {
        cupomImportadoId: cupomImportado.id,
        dataAgendamento: dataAgendamento ? new Date(dataAgendamento) : new Date(),
        status: "AGENDADA",
        valorPago: cupomImportado.precoFinal,
      },
    });

    await tx.cupomImportado.update({
      where: { id: cupomImportado.id },
      data: {
        status: "USADO",
        consultaId: consulta.id,
        usadoEm: new Date(),
      },
    });

    return consulta;
  });

  return ok({
    sucesso: true,
    consultaId: result.id,
    status: result.status,
    dataAgendamento: result.dataAgendamento,
    valorPago: result.valorPago,
  });
}
