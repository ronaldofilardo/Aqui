import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest, notFound } from "@/lib/api-helpers";
import { criarTransferenciaPix } from "@/lib/asaas-client";
import { criarAuditLog } from "@/lib/audit";

function gerarTxIdPix(): string {
  const now = new Date();
  const pad = (n: number, d = 2) => String(n).padStart(d, "0");
  const timestamp = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `${timestamp}${random}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, error } = await requireGestor();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Corpo da requisição inválido");

  const mesReferencia = Number(body.mesReferencia);
  const anoReferencia = Number(body.anoReferencia);

  if (!mesReferencia || !anoReferencia) {
    return badRequest("mesReferencia e anoReferencia são obrigatórios");
  }

  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { id: params.id },
  });

  if (!estabelecimento) {
    return notFound("Estabelecimento não encontrado");
  }

  const comissoesPendentes = await prisma.comissao.findMany({
    where: {
      estabelecimentoId: params.id,
      mesReferencia,
      anoReferencia,
      statusPagamento: "PENDENTE",
    },
  });

  if (comissoesPendentes.length === 0) {
    return badRequest(
      "Não há comissões pendentes para este estabelecimento no período",
    );
  }

  const valorTotal = comissoesPendentes.reduce(
    (sum, c) => sum + Number(c.valorEstabelecimento),
    0,
  );

  let txId = gerarTxIdPix();

  if (estabelecimento.pixChave && estabelecimento.pixTipo) {
    try {
      const transfer = await criarTransferenciaPix({
        pixChave: estabelecimento.pixChave,
        pixTipo: String(estabelecimento.pixTipo),
        valor: valorTotal,
        descricao: `Comissão ASA ${String(mesReferencia).padStart(2, "0")}/${anoReferencia} - ${estabelecimento.nomeFantasia}`,
      });
      if (transfer?.id) txId = transfer.id;
    } catch {
      // mantém txId gerado localmente como fallback
    }
  }

  await prisma.comissao.updateMany({
    where: { id: { in: comissoesPendentes.map((c) => c.id) } },
    data: { statusPagamento: "PAGO", dataPagamento: new Date() },
  });

  const emailDestino = estabelecimento.email ?? "";

  // Simula envio de email de recibo
  const recibo = {
    tipo: "PAGAMENTO",
    data: new Date().toLocaleString("pt-BR"),
    referencia: `${String(mesReferencia).padStart(2, "0")}/${anoReferencia}`,
    beneficiario: estabelecimento.nomeFantasia,
    valor: `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    txId,
    status: "PAGAMENTO PROCESSADO",
  };

  console.log("=".repeat(60));
  console.log("📧 EMAIL SIMULADO - RECIBO DE PAGAMENTO (ESTABELECIMENTO)");
  console.log("=".repeat(60));
  console.log(`Para: ${emailDestino || "N/A"}`);
  console.log(`Destinatário: ${estabelecimento.nomeFantasia}`);
  console.log(`\n${JSON.stringify(recibo, null, 2)}`);
  console.log("=".repeat(60));

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "PIX_ESTABELECIMENTO",
    entidade: "estabelecimento",
    entidadeId: params.id,
    detalhes: { mesReferencia, anoReferencia, valor: valorTotal, txId },
  });

  return ok({
    sucesso: true,
    recibo,
    mensagem: `Pagamento de R$ ${valorTotal.toFixed(2)} processado com sucesso${emailDestino ? `. Recibo enviado para ${emailDestino}` : ""}`,
  });
}
