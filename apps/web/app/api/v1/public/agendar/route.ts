import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, notFound } from "@/lib/api-helpers";
import { agendarConsultaSchema } from "@asa/shared";
import { checkRateLimit, tooManyRequests, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limiting: 10 agendamentos por minuto por IP (skipped in development)
  const ip = getClientIp(req);
  if (!checkRateLimit(`agendar:${ip}`, { max: 10, windowMs: 60_000 })) {
    return tooManyRequests(60_000);
  }

  const body = await req.json();
  const parsed = agendarConsultaSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { codigoCupom, cupomImportadoId, dataAgendamento } = parsed.data;

  const cupomConfig = await prisma.cupomConfig.findUnique({
    where: { codigoCupom },
  });

  if (!cupomConfig || cupomConfig.status !== "ATIVO") {
    return notFound("Cupom não encontrado ou inativo");
  }

  // Localizar o cupom importado pelo ID específico — previne enumeração
  const cupomImportado = await prisma.cupomImportado.findFirst({
    where: {
      id: cupomImportadoId,
      cupomConfigId: cupomConfig.id,
      status: "DISPONIVEL",
    },
  });

  if (!cupomImportado) {
    return badRequest("Cupóm não disponível ou inválido");
  }

  // Criar consulta e marcar cupóm como usado em uma transação
  const result = await prisma.$transaction(async (tx) => {
    const consulta = await tx.consulta.create({
      data: {
        cupomImportadoId: cupomImportado.id,
        dataAgendamento: dataAgendamento
          ? new Date(dataAgendamento)
          : new Date(),
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
