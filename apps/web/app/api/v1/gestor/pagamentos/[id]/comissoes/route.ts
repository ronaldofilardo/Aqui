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

  // Buscar pagamento para obter mes/ano/consultorId
  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
  });

  if (!pagamento) {
    return notFound("Pagamento não encontrado");
  }

  // Buscar comissões do consultor neste mês/ano
  const comissoes = await prisma.comissao.findMany({
    where: {
      consultorId: pagamento.consultorId,
      mesReferencia: pagamento.mesReferencia,
      anoReferencia: pagamento.anoReferencia,
    },
    include: {
      consulta: {
        select: {
          dataAgendamento: true,
          dataRealizacao: true,
          status: true,
          valorPago: true,
        },
      },
      estabelecimento: {
        select: {
          nomeFantasia: true,
        },
      },
    },
    orderBy: { criadoEm: "asc" },
  });

  return ok({
    pagamento: {
      id: pagamento.id,
      mesReferencia: pagamento.mesReferencia,
      anoReferencia: pagamento.anoReferencia,
      valorTotal: Number(pagamento.valorTotal),
      quantidadeConsultas: pagamento.quantidadeConsultas,
      status: pagamento.status,
      pagoEm: pagamento.pagoEm,
    },
    comissoes: comissoes.map((c) => ({
      id: c.id,
      estabelecimento: c.estabelecimento.nomeFantasia,
      dataAgendamento: c.consulta?.dataAgendamento,
      dataRealizacao: c.consulta?.dataRealizacao,
      statusConsulta: c.consulta?.status,
      valorEstabelecimento: Number(c.valorEstabelecimento),
      valorConsultor: Number(c.valorConsultor),
      statusPagamento: c.statusPagamento,
    })),
  });
}
