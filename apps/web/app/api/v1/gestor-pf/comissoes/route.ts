import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, notFound, requireGestorPFWithScope } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mesReferencia = searchParams.get("mesReferencia");

  const parceirores = await prisma.parceiro.findMany({
    where: { gestorPfId },
    include: {
      comissoes: mesReferencia
        ? { where: { mesReferencia } }
        : { orderBy: { mesReferencia: "desc" }, take: 12 },
      _count: { select: { indicacoes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = await Promise.all(
    parceirores.map(async (p) => {
      const procedimentos = await prisma.procedimentoPF.findMany({
        where: {
          parceiroId: p.id,
          statusComissao: { not: "PAGA" },
        },
        select: {
          id: true,
          dataReferencia: true,
          paciente: true,
          procedimento: true,
          totalPago: true,
          valorComissao: true,
          statusComissao: true,
        },
        orderBy: { dataReferencia: "desc" },
      });

      const totalPendente = procedimentos.reduce(
        (sum, pr) => sum + Number(pr.valorComissao),
        0
      );

      const totalPago = p.comissoes
        .filter((c) => c.status === "PAGA")
        .reduce((sum, c) => sum + Number(c.valorTotal), 0);

      return {
        id: p.id,
        nome: p.nome,
        cpf: p.cpf,
        status: p.status,
        percentualComissao: p.percentualComissao,
        totalIndicados: p._count.indicacoes,
        totalPendente,
        totalPago,
        comissoes: p.comissoes.map((c) => ({
          id: c.id,
          mesReferencia: c.mesReferencia,
          valorTotal: c.valorTotal,
          status: c.status,
          dataPagamento: c.dataPagamento,
        })),
        procedimentosRecentes: procedimentos.slice(0, 10),
      };
    })
  );

  return ok(result);
}

export async function PUT(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const { parceiroId, mesReferencia, status } = body;

  if (!parceiroId || !mesReferencia) {
    return badRequest("parceiroId e mesReferencia são obrigatórios");
  }

  const parceiro = await prisma.parceiro.findFirst({
    where: { id: parceiroId, gestorPfId },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  if (status === "PAGA") {
    await prisma.procedimentoPF.updateMany({
      where: {
        parceiroId,
        dataReferencia: {
          gte: new Date(`${mesReferencia}-01`),
          lt: new Date(`${mesReferencia}-31`),
        },
        statusComissao: { not: "PAGA" },
      },
      data: { statusComissao: "PAGA" },
    });

    await prisma.comissaoParceiro.updateMany({
      where: { parceiroId, mesReferencia },
      data: {
        status: "PAGA",
        dataPagamento: new Date(),
      },
    });
  } else {
    await prisma.comissaoParceiro.updateMany({
      where: { parceiroId, mesReferencia },
      data: { status: status || "ABERTO" },
    });
  }

  const comissao = await prisma.comissaoParceiro.findUnique({
    where: {
      parceiroId_mesReferencia: { parceiroId, mesReferencia },
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: status === "PAGA" ? "QUITAR_COMISSAO" : "ATUALIZAR_COMISSAO",
    entidade: "comissao_parceiro",
    entidadeId: comissao?.id,
    detalhes: { parceiroId, mesReferencia, status },
  });

  return ok(comissao);
}

export async function POST(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const { mesReferencia } = body;

  if (!mesReferencia || !/^\d{4}-\d{2}$/.test(mesReferencia)) {
    return badRequest("mesReferencia é obrigatório (formato: YYYY-MM)");
  }

  const [ano, mes] = mesReferencia.split("-").map(Number);
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59);

  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      dataReferencia: {
        gte: dataInicio,
        lte: dataFim,
      },
      statusComissao: "PENDENTE",
      parceiro: {
        status: "ATIVO",
        gestorPfId,
      },
      indicado: {
        status: "ATIVO",
      },
    },
    include: {
      parceiro: true,
    },
  });

  const parceiroIds = [...new Set(procedimentos.map((p) => p.parceiroId!))];

  const comissoesPorParceiro: Record<string, number> = {};
  for (const p of procedimentos) {
    if (!comissoesPorParceiro[p.parceiroId!]) {
      comissoesPorParceiro[p.parceiroId!] = 0;
    }
    comissoesPorParceiro[p.parceiroId!] += Number(p.valorComissao);
  }

  const results = await Promise.all(
    parceiroIds.map(async (parceiroId) => {
      const total = comissoesPorParceiro[parceiroId] || 0;

      const comissao = await prisma.comissaoParceiro.upsert({
        where: {
          parceiroId_mesReferencia: { parceiroId, mesReferencia },
        },
        create: {
          parceiroId,
          mesReferencia,
          valorTotal: total,
          status: "CALCULADA",
        },
        update: {
          valorTotal: total,
          status: "CALCULADA",
        },
      });

      await prisma.procedimentoPF.updateMany({
        where: {
          parceiroId,
          dataReferencia: { gte: dataInicio, lte: dataFim },
          statusComissao: "PENDENTE",
        },
        data: { statusComissao: "CALCULADA" },
      });

      return comissao;
    })
  );

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "AGREGAR_COMISSOES_MENSAIS",
    entidade: "comissao_parceiro",
    detalhes: { mesReferencia, totalParceiros: results.length },
  });

  return ok({
    message: `Comissões de ${mesReferencia} agregadas para ${results.length} parceiros`,
    comissoes: results,
  });
}