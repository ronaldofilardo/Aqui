import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireGestor();
  if (error) return error;

  const url = new URL(req.url);
  const mes = Number(url.searchParams.get("mes")) || new Date().getMonth() + 1;
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();

  // Pagamentos de consultores
  const pagamentosConsultores = await prisma.pagamento.findMany({
    where: { mesReferencia: mes, anoReferencia: ano },
    include: {
      consultor: {
        include: { usuario: { select: { nome: true, email: true } } },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  // Pagamentos de estabelecimentos (agrupado por estabelecimento)
  const comissoes = (await prisma.comissao.findMany({
    where: { mesReferencia: mes, anoReferencia: ano },
    include: {
      estabelecimento: {
        select: {
          id: true,
          nomeFantasia: true,
          email: true,
          pixChave: true,
          pixTipo: true,
        },
      },
      consultor: {
        select: {
          id: true,
          usuario: { select: { nome: true } },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  })) as any[];

  type EstabGroup = {
    id: string;
    nomeFantasia: string;
    email: string | null;
    pixChave: string | null;
    pixTipo: string | null;
    valorTotal: number;
    quantidadeConsultas: number;
    status: string;
    dataPagamento: Date | null;
    totalComissoes: number;
    pagas: number;
    consultores: Array<{ id: string; nome: string }>;
  };

  // Agrupar comissões por estabelecimento
  const grouped = comissoes.reduce(
    (acc: Record<string, EstabGroup>, com: any) => {
      const estabId = com.estabelecimento.id;
      if (!acc[estabId]) {
        acc[estabId] = {
          id: estabId,
          nomeFantasia: com.estabelecimento.nomeFantasia,
          email: com.estabelecimento.email,
          pixChave: com.estabelecimento.pixChave,
          pixTipo: com.estabelecimento.pixTipo,
          valorTotal: 0,
          quantidadeConsultas: 0,
          status: "PENDENTE",
          dataPagamento: null,
          totalComissoes: 0,
          pagas: 0,
          consultores: [],
        };
      }
      acc[estabId].valorTotal += Number(com.valorEstabelecimento);
      acc[estabId].quantidadeConsultas += 1;
      acc[estabId].totalComissoes += 1;
      if (com.statusPagamento === "PAGO") {
        acc[estabId].pagas += 1;
        if (com.dataPagamento) {
          acc[estabId].dataPagamento = com.dataPagamento;
        }
      }
      // Adicionar consultor único
      if (
        !acc[estabId].consultores.find((c: any) => c.id === com.consultor.id)
      ) {
        acc[estabId].consultores.push({
          id: com.consultor.id,
          nome: com.consultor.usuario.nome,
        });
      }
      return acc;
    },
    {},
  );

  // Status PAGO somente se TODAS as comissões estão pagas
  const pagamentosEstabelecimentos = Object.values(grouped).map((g: any) => {
    const { totalComissoes, pagas, ...rest } = g;
    return { ...rest, status: pagas === totalComissoes ? "PAGO" : "PENDENTE" };
  });

  return ok({
    mes,
    ano,
    pagamentosConsultores,
    pagamentosEstabelecimentos,
  });
}
