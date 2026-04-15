import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, notFound } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireGestor();
  if (error) return error;

  const pagamentoId = params.id;
  const mes = req.nextUrl.searchParams.get("mes");
  const ano = req.nextUrl.searchParams.get("ano");

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

  if (pagamento.status !== "PAGO") {
    return notFound("Este pagamento não foi processado ainda");
  }

  // Buscar comissões do período
  const comissoes = await prisma.comissao.findMany({
    where: {
      consultorId: pagamento.consultorId,
      mesReferencia: mes ? Number(mes) : pagamento.mesReferencia,
      anoReferencia: ano ? Number(ano) : pagamento.anoReferencia,
      statusPagamento: "PAGO",
    },
    include: {
      estabelecimento: { select: { nomeFantasia: true } },
      consulta: {
        select: { dataAgendamento: true, dataRealizacao: true, status: true },
      },
    },
  });

  const recibo = {
    tipo: "PAGAMENTO",
    data: pagamento.pagoEm
      ? new Date(pagamento.pagoEm).toLocaleString("pt-BR")
      : new Date().toLocaleString("pt-BR"),
    referencia: `${String(pagamento.mesReferencia).padStart(2, "0")}/${pagamento.anoReferencia}`,
    beneficiario: pagamento.consultor.usuario.nome,
    valor: `R$ ${Number(pagamento.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    txId: pagamento.pixTxid || "N/A",
    status: "PAGAMENTO PROCESSADO",
  };

  const comissoesFormatadas = comissoes.map((c) => ({
    id: c.id,
    estabelecimento: c.estabelecimento.nomeFantasia,
    dataRealizacao: c.consulta.dataRealizacao,
    dataAgendamento: c.consulta.dataAgendamento,
    statusConsulta: c.consulta.status,
    valorConsultor: Number(c.valorConsultor),
  }));

  return ok({
    recibo,
    comissoes: comissoesFormatadas,
  });
}
