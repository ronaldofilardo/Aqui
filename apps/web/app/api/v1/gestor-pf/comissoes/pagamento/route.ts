import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireGestorPFWithScope } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/api-helpers";

/**
 * POST /api/v1/gestor-pf/comissoes/pagamento
 * 
 * Marca uma ou mais comissões como PAGA
 * 
 * Body:
 * {
 *   comissaoIds: string[]; // IDs das comissões a serem pagas
 *   dataPagamento: string; // YYYY-MM-DD (opcional, default: hoje)
 * }
 */
export async function POST(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  const { comissaoIds, dataPagamento } = body;

  if (!comissaoIds || !Array.isArray(comissaoIds) || comissaoIds.length === 0) {
    return badRequest("É necessário informar pelo menos um ID de comissão");
  }

  // Verificar se todas as comissões pertencem ao gestor
  const comissoes = await prisma.comissaoComercial.findMany({
    where: {
      id: { in: comissaoIds },
      comercial: {
        gestorPfId,
      },
    },
    include: {
      comercial: {
        include: {
          usuario: true,
        },
      },
    },
  });

  if (comissoes.length !== comissaoIds.length) {
    return badRequest("Alguma comissão não foi encontrada ou não pertence ao seu gestor");
  }

  // Verificar se alguma já está paga
  const jaPagas = comissoes.filter((c) => c.status === "PAGA");
  if (jaPagas.length > 0) {
    return badRequest(
      `As seguintes comissões já estão pagas: ${jaPagas.map((c) => c.mesReferencia).join(", ")}`
    );
  }

  const dataPag = dataPagamento ? new Date(dataPagamento) : new Date();

  try {
    // Atualizar comissões em transação
    await prisma.$transaction(async (tx) => {
      for (const comissaoId of comissaoIds) {
        await tx.comissaoComercial.update({
          where: { id: comissaoId },
          data: {
            status: "PAGA",
            dataPagamento: dataPag,
          },
        });
      }
    });

    // Audit log
    try {
      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "PAGAMENTO_COMISSAO",
        entidade: "comissao_comercial",
        entidadeId: comissaoIds.join(","),
        detalhes: {
          quantidade: comissaoIds.length,
          dataPagamento: dataPag.toISOString(),
          totalPago: comissoes.reduce((sum, c) => sum + Number(c.valorComissao), 0),
        },
      });
    } catch (auditErr) {
      console.error("[pagamento] Erro ao criar audit log:", auditErr);
    }

    return ok({
      mensagem: `${comissaoIds.length} comissões marcadas como pagas`,
      totalPago: comissoes.reduce((sum, c) => sum + Number(c.valorComissao), 0),
      dataPagamento: dataPag.toISOString(),
    });
  } catch (err: any) {
    console.error("[pagamento] Erro ao processar pagamento:", err);
    return badRequest(err?.message || "Erro ao processar pagamento");
  }
}