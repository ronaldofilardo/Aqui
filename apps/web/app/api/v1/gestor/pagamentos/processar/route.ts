import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestorWithScope, ok, badRequest } from "@/lib/api-helpers";
import { processarPagamentosSchema } from "@asa/shared";
import { criarTransferenciaPix } from "@/lib/asaas-client";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { session, error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = processarPagamentosSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { mesReferencia, anoReferencia } = parsed.data;

  // Group pending commissions by consultor
  const comissoesPendentes = (await prisma.comissao.findMany({
    where: {
      mesReferencia,
      anoReferencia,
      statusPagamento: "PENDENTE",
      consultorId: { in: consultorIds },
    },
    include: {
      consultor: {
        include: { usuario: { select: { nome: true } } },
      },
    },
  })) as any[];

  if (comissoesPendentes.length === 0) {
    return badRequest("Nenhuma comissão pendente para este período");
  }

  // Group by consultor
  const grouped = comissoesPendentes.reduce<
    Record<
      string,
      {
        consultorId: string;
        nome: string;
        total: number;
        qtd: number;
        comissaoIds: string[];
      }
    >
  >((acc, com) => {
    const key = com.consultorId;
    if (!acc[key]) {
      acc[key] = {
        consultorId: key,
        nome: com.consultor.usuario.nome,
        total: 0,
        qtd: 0,
        comissaoIds: [],
      };
    }
    acc[key].total += Number(com.valorConsultor);
    acc[key].qtd += 1;
    acc[key].comissaoIds.push(com.id);
    return acc;
  }, {});

  const results = [];

  for (const data of Object.values(grouped)) {
    const consultor = await prisma.consultor.findUnique({
      where: { id: data.consultorId },
    });

    // Create payment record
    const pagamento = await prisma.pagamento.create({
      data: {
        consultorId: data.consultorId,
        mesReferencia,
        anoReferencia,
        valorTotal: data.total,
        quantidadeConsultas: data.qtd,
        status: "PROCESSANDO",
      },
    });

    let pixTxid = null;
    let status: "PAGO" | "FALHOU" = "FALHOU";

    // Try PIX transfer via Asaas
    if (consultor?.pixChave && consultor?.pixTipo) {
      try {
        const transfer = await criarTransferenciaPix({
          pixChave: consultor.pixChave,
          pixTipo: consultor.pixTipo,
          valor: data.total,
          descricao: `Comissão ASA ${mesReferencia}/${anoReferencia} - ${data.nome}`,
        });
        pixTxid = transfer.id;
        status = "PAGO";
      } catch {
        status = "FALHOU";
      }
    }

    // Update payment and commissions
    await prisma.$transaction(async (tx: any) => {
      await tx.pagamento.update({
        where: { id: pagamento.id },
        data: {
          status,
          pixTxid,
          ...(status === "PAGO" && {
            dataPagamento: new Date(),
            pagoEm: new Date(),
          }),
        },
      });

      if (status === "PAGO") {
        await tx.comissao.updateMany({
          where: { id: { in: data.comissaoIds } },
          data: {
            statusPagamento: "PAGO",
            dataPagamento: new Date(),
          },
        });
      }
    });

    results.push({
      consultor: data.nome,
      valor: data.total,
      consultas: data.qtd,
      status,
      pixTxid,
    });
  }

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "PROCESSAR_PAGAMENTOS",
    entidade: "pagamento",
    detalhes: { mesReferencia, anoReferencia, total: results.length },
  });

  return ok({
    sucesso: true,
    mesReferencia,
    anoReferencia,
    pagamentos: results,
  });
}
