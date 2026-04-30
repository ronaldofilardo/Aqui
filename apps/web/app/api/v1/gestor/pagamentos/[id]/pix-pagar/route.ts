import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  requireGestorWithScope,
  ok,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

function gerarTxIdPix(): string {
  const { randomBytes } = require("crypto");
  const now = new Date();
  const pad = (n: number, d = 2) => String(n).padStart(d, "0");
  const timestamp = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = randomBytes(4).toString("hex");
  return `${timestamp}${random}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, error, consultorIds } = await requireGestorWithScope();
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

  if (!consultorIds.includes(pagamento.consultorId)) {
    return forbidden();
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

  // TODO: integrar com Sendgrid, AWS SES ou similar para envio real de email
  console.info("[pix-pagar] pagamento processado", {
    pagamentoId,
    consultorId: pagamento.consultorId,
    referencia: recibo.referencia,
  });

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
