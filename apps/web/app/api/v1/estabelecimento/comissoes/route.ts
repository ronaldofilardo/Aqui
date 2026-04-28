import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireEstabelecimento, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireEstabelecimento();
  if (error) return error;

  const estabelecimentoId = (session!.user as any).estabelecimentoId as string;

  const url = new URL(req.url);
  const mes = Number(url.searchParams.get("mes")) || new Date().getMonth() + 1;
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();

  const comissoes = await prisma.comissao.findMany({
    where: { estabelecimentoId, mesReferencia: mes, anoReferencia: ano },
    include: {
      consulta: {
        include: {
          cupomImportado: { select: { pacienteNome: true, servico: true } },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  const total = comissoes.reduce(
    (sum: any, c) => sum + Number(c.valorEstabelecimento),
    0,
  );

  return ok({
    mes,
    ano,
    comissoes: comissoes.map((c) => ({
      id: c.id,
      pacienteNome: c.consulta?.cupomImportado?.pacienteNome ?? "—",
      servico: c.consulta?.cupomImportado?.servico ?? "—",
      dataConsulta:
        c.consulta?.dataRealizacao ?? c.consulta?.dataAgendamento ?? null,
      statusConsulta: c.consulta?.status ?? null,
      valorEstabelecimento: Number(c.valorEstabelecimento),
      statusPagamento: c.statusPagamento,
      dataPagamento: c.dataPagamento,
      criadoEm: c.criadoEm,
    })),
    totalConsultas: comissoes.length,
    totalComissao: total,
  });
}
