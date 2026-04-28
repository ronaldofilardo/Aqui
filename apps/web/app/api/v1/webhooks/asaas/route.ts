import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@asa/database";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  // Validate webhook origin using the shared token configured in Asaas dashboard
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!webhookToken) {
    console.error("ASAAS_WEBHOOK_TOKEN não configurado");
    return NextResponse.json(
      { error: "Configuração inválida" },
      { status: 500 },
    );
  }

  const incomingToken = req.headers.get("access_token") ?? "";
  let tokenValid = false;
  try {
    tokenValid =
      incomingToken.length === webhookToken.length &&
      timingSafeEqual(Buffer.from(incomingToken), Buffer.from(webhookToken));
  } catch {
    tokenValid = false;
  }

  if (!tokenValid) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const { event, transfer } = body;
  if (!transfer?.id) {
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }

  const pagamento = await prisma.pagamento.findFirst({
    where: { pixTxid: transfer.id },
  });

  if (!pagamento) {
    return NextResponse.json({ ok: true }); // Ignore unknown transfers
  }

  let newStatus: "PAGO" | "FALHOU" | null = null;

  if (event === "TRANSFER_CONFIRMED" || event === "TRANSFER_DONE") {
    newStatus = "PAGO";
  } else if (event === "TRANSFER_FAILED" || event === "TRANSFER_CANCELLED") {
    newStatus = "FALHOU";
  }

  if (newStatus) {
    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        status: newStatus,
        ...(newStatus === "PAGO" && { pagoEm: new Date() }),
      },
    });

    if (newStatus === "PAGO") {
      await prisma.comissao.updateMany({
        where: {
          consultorId: pagamento.consultorId,
          mesReferencia: pagamento.mesReferencia,
          anoReferencia: pagamento.anoReferencia,
          statusPagamento: "PENDENTE",
        },
        data: {
          statusPagamento: "PAGO",
          dataPagamento: new Date(),
        },
      });
    }

    await criarAuditLog({
      acao: "WEBHOOK_ASAAS",
      entidade: "pagamento",
      entidadeId: pagamento.id,
      detalhes: { event, transferId: transfer.id, newStatus },
    });
  }

  return NextResponse.json({ ok: true });
}
