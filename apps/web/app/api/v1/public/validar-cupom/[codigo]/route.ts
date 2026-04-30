import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, notFound } from "@/lib/api-helpers";
import { checkRateLimit, tooManyRequests, getClientIp } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  // Rate limiting: 20 validações por minuto por IP (skipped in development)
  const ip = getClientIp(req);
  if (
    !checkRateLimit(`validar-cupom:${ip}`, {
      max: 20,
      windowMs: 60_000,
    })
  ) {
    return tooManyRequests(60_000);
  }

  const { codigo } = await params;

  const cupomConfig = await prisma.cupomConfig.findUnique({
    where: { codigoCupom: codigo },
    include: {
      estabelecimento: {
        select: { nomeFantasia: true, cidade: true, estado: true },
      },
    },
  });

  if (!cupomConfig || cupomConfig.status !== "ATIVO") {
    return notFound("Cupom não encontrado ou inativo");
  }

  // Find latest available imported coupon for this config
  const cupomDisponivel = await prisma.cupomImportado.findFirst({
    where: {
      cupomConfigId: cupomConfig.id,
      status: "DISPONIVEL",
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok({
    codigo: cupomConfig.codigoCupom,
    descricao: cupomConfig.descricao,
    estabelecimento: cupomConfig.estabelecimento,
    disponivel: !!cupomDisponivel,
    cupomImportadoId: cupomDisponivel?.id || null,
    precoOriginal: cupomDisponivel?.precoOriginal || null,
    descontoPercentual: cupomDisponivel?.descontoPercentual || null,
    precoFinal: cupomDisponivel?.precoFinal || null,
  });
}
