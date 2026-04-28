import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireGestor();
  if (error) return error;

  const url = new URL(req.url);
  const mes = Number(url.searchParams.get("mes")) || new Date().getMonth() + 1;
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();

  const where = { mesReferencia: mes, anoReferencia: ano };

  const comissoes = await prisma.comissao.findMany({
    where,
    select: {
      id: true,
      consultorId: true,
      estabelecimentoId: true,
      valorConsultor: true,
      valorEstabelecimento: true,
      mesReferencia: true,
      anoReferencia: true,
      statusPagamento: true,
      criadoEm: true,
      estabelecimento: { select: { nomeFantasia: true } },
      consultor: {
        select: { usuario: { select: { nome: true } } },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  // Aggregate by consultor
  const grouped = comissoes.reduce<
    Record<
      string,
      {
        consultorId: string;
        consultorNome: string;
        totalConsultas: number;
        totalComissao: number;
        status: string;
      }
    >
  >((acc, com) => {
    const key = com.consultorId;
    if (!acc[key]) {
      acc[key] = {
        consultorId: key,
        consultorNome: com.consultor.usuario.nome,
        totalConsultas: 0,
        totalComissao: 0,
        status: "PENDENTE",
      };
    }
    acc[key].totalConsultas += 1;
    acc[key].totalComissao += Number(com.valorConsultor);
    if (com.statusPagamento === "PAGO") acc[key].status = "PAGO";
    return acc;
  }, {});

  // Aggregate by estabelecimento
  const groupedByEstab = comissoes.reduce<
    Record<
      string,
      {
        estabelecimentoId: string;
        estabelecimentoNome: string;
        consultorNome: string;
        totalConsultas: number;
        totalComissao: number;
        status: string;
      }
    >
  >((acc, com) => {
    const key = com.estabelecimentoId;
    if (!acc[key]) {
      acc[key] = {
        estabelecimentoId: key,
        estabelecimentoNome: com.estabelecimento.nomeFantasia,
        consultorNome: com.consultor.usuario.nome,
        totalConsultas: 0,
        totalComissao: 0,
        status: "PENDENTE",
      };
    }
    acc[key].totalConsultas += 1;
    acc[key].totalComissao += Number(com.valorEstabelecimento);
    if (com.statusPagamento === "PAGO") acc[key].status = "PAGO";
    return acc;
  }, {});

  const totalConsultas = comissoes.length;
  const totalConsultores = comissoes.reduce(
    (s, c) => s + Number(c.valorConsultor),
    0,
  );
  const totalEstabelecimentos = comissoes.reduce(
    (s, c) => s + Number(c.valorEstabelecimento),
    0,
  );

  return ok({
    mes,
    ano,
    agrupado: Object.values(grouped),
    agrupadoPorEstabelecimento: Object.values(groupedByEstab),
    totais: { totalConsultas, totalConsultores, totalEstabelecimentos },
  });
}
