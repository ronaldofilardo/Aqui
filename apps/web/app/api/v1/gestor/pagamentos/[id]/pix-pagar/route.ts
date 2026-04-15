import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest, notFound } from "@/lib/api-helpers";
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

  const pagamentoId = params.id;

  // Buscar pagamento
  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    include: {
      consultor: {
        include: {
          usuario: { select: { nome: true, email: true } },
        },
      },
    },
  });

  if (!pagamento) {
    return notFound("Pagamento não encontrado");
  }

  if (pagamento.status === "PAGO") {
    return badRequest("Este pagamento já foi processado");
  }

  // Gerar TxID e atualizar pagamento
  const txId = gerarTxIdPix();
  const pagamentoAtualizado = await prisma.pagamento.update({
    where: { id: pagamentoId },
    data: {
      pixTxid: txId,
      status: "PAGO",
      pagoEm: new Date(),
      dataPagamento: new Date(),
    },
    include: {
      consultor: {
        include: {
          usuario: { select: { nome: true, email: true } },
        },
      },
    },
  });

  const emailDestino = pagamentoAtualizado.consultor.usuario.email;
  const nomeRecebedor = pagamentoAtualizado.consultor.usuario.nome;
  const valorTotal = Number(pagamentoAtualizado.valorTotal);

  const recibo = {
    tipo: "PAGAMENTO",
    data: new Date().toLocaleString("pt-BR"),
    referencia: `${String(pagamentoAtualizado.mesReferencia).padStart(2, "0")}/${pagamentoAtualizado.anoReferencia}`,
    beneficiario: nomeRecebedor,
    valor: `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    txId,
    status: "PAGAMENTO PROCESSADO",
  };

  // Log simulado (em produção integrar com Sendgrid, AWS SES, etc.)
  console.log("=".repeat(60));
  console.log("📧 EMAIL SIMULADO - RECIBO DE PAGAMENTO");
  console.log("=".repeat(60));
  console.log(`Para: ${emailDestino}`);
  console.log(`Destinatário: ${nomeRecebedor}`);
  console.log(`\n${JSON.stringify(recibo, null, 2)}`);
  console.log("=".repeat(60));

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "PIX_CONSULTOR",
    entidade: "pagamento",
    entidadeId: pagamentoId,
    detalhes: {
      valor: valorTotal,
      txId,
      mesReferencia: pagamentoAtualizado.mesReferencia,
      anoReferencia: pagamentoAtualizado.anoReferencia,
    },
  });

  return ok({
    sucesso: true,
    pagamento: {
      id: pagamentoAtualizado.id,
      status: pagamentoAtualizado.status,
      pixTxid: pagamentoAtualizado.pixTxid,
      pagoEm: pagamentoAtualizado.pagoEm,
    },
    recibo,
    mensagem: `Pagamento de R$ ${valorTotal.toFixed(2)} processado com sucesso. Recibo enviado para ${emailDestino}`,
  });
}
