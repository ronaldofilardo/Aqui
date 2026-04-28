import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, notFound } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireGestor();
  if (error) return error;

  const estabelecimentoId = params.id;
  const mes = req.nextUrl.searchParams.get("mes");
  const ano = req.nextUrl.searchParams.get("ano");

  if (!mes || !ano) {
    return notFound("mesReferencia e anoReferencia são obrigatórios");
  }

  const mesReferencia = Number(mes);
  const anoReferencia = Number(ano);

  // Buscar estabelecimento
  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { id: estabelecimentoId },
  });

  if (!estabelecimento) {
    return notFound("Estabelecimento não encontrado");
  }

  // Buscar comissões do período (já pagas)
  const comissoes = await prisma.comissao.findMany({
    where: {
      estabelecimentoId,
      mesReferencia,
      anoReferencia,
      statusPagamento: "PAGO",
    },
    include: {
      consultor: {
        include: {
          usuario: { select: { nome: true } },
        },
      },
      consulta: {
        select: { dataAgendamento: true, dataRealizacao: true, status: true },
      },
    },
  });

  if (comissoes.length === 0) {
    return notFound(
      "Nenhuma comissão paga no período para este estabelecimento",
    );
  }

  const valorTotal = comissoes.reduce(
    (sum: number, c: any) => sum + Number(c.valorEstabelecimento),
    0,
  );

  // Usar a data do pagamento da última comissão como referência
  const dataPagamento = comissoes[0].dataPagamento || new Date();

  // Gerar TxID local como fallback
  const gerarTxId = (): string => {
    const now = new Date();
    const pad = (n: number, d = 2) => String(n).padStart(d, "0");
    const timestamp = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const random = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
    return `${timestamp}${random}`;
  };

  const recibo = {
    tipo: "PAGAMENTO",
    data: new Date(dataPagamento).toLocaleString("pt-BR"),
    referencia: `${String(mesReferencia).padStart(2, "0")}/${anoReferencia}`,
    beneficiario: estabelecimento.nomeFantasia,
    valor: `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    txId: gerarTxId(),
    status: "PAGAMENTO PROCESSADO",
  };

  const comissoesFormatadas = comissoes.map((c: any) => ({
    id: c.id,
    estabelecimento: estabelecimento.nomeFantasia,
    consultor: c.consultor.usuario.nome,
    dataRealizacao: c.consulta.dataRealizacao,
    dataAgendamento: c.consulta.dataAgendamento,
    statusConsulta: c.consulta.status,
    valorEstabelecimento: Number(c.valorEstabelecimento),
  }));

  return ok({
    recibo,
    comissoes: comissoesFormatadas,
  });
}
