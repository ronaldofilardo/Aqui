import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";

/**
 * GET /api/v1/backoffice/relatorio-comissoes
 * 
 * Query params:
 * - inicio: YYYY-MM (mês inicial)
 * - fim: YYYY-MM (mês final)
 * - comercialId: uuid (opcional, filtra por comercial)
 */
export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const comercialId = searchParams.get("comercialId");
  const funcao = searchParams.get("funcao");

  if (!inicio || !fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  // Busca as lideranças deste gestor e seus comerciais
  const liderancasDoGestor = await prisma.lideranca.findMany({
    where: { backofficeId },
    include: {
      comerciais: { select: { id: true, funcao: true } }
    }
  });
  
  const comerciaisDoGestor = liderancasDoGestor.flatMap(l => l.comerciais);
  let comercialIds = comerciaisDoGestor.map(c => c.id);

  // Filtrar por função se especificado
  if (funcao) {
    comercialIds = comerciaisDoGestor
      .filter(c => c.funcao === funcao)
      .map(c => c.id);
  }

  // Se não houver comerciais, retorna array vazio
  if (comercialIds.length === 0) {
    return ok({
      comissoes: [],
      resumo: {
        porMes: [],
        totalGeral: {
          totalVendas: 0,
          totalComissao: 0,
          quantidade: 0,
        },
      },
    });
  }

  const where: any = {
    comercialId: { in: comercialIds },
    mesReferencia: {
      gte: inicio,
      lte: fim,
    },
  };

  if (comercialId) {
    where.comercialId = comercialId;
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where,
    include: {
      comercial: {
        include: {
          usuario: {
            select: { nome: true, email: true },
          },
        },
      },
    },
    orderBy: { mesReferencia: "desc" },
  });

  // Agrupar por mês para totais
  const porMes = new Map<string, { totalVendas: number; totalComissao: number; quantidade: number }>();
  let totalGeralVendas = 0;
  let totalGeralComissao = 0;

  // Agrupar por função para totais
  const porFuncao = new Map<string, { 
    totalVendas: number; 
    totalComissao: number; 
    quantidade: number;
    comerciais: Set<string>;
  }>();

  comissoes.forEach((c) => {
    const mes = c.mesReferencia;
    const funcao = c.comercial.funcao || "SEM_FUNCAO";
    
    // Agrupamento por mês
    const atualMes = porMes.get(mes) || { totalVendas: 0, totalComissao: 0, quantidade: 0 };
    atualMes.totalVendas += Number(c.valorVendas);
    atualMes.totalComissao += Number(c.valorComissao);
    atualMes.quantidade += 1;
    porMes.set(mes, atualMes);

    // Agrupamento por função
    const atualFuncao = porFuncao.get(funcao) || { 
      totalVendas: 0, 
      totalComissao: 0, 
      quantidade: 0,
      comerciais: new Set<string>(),
    };
    atualFuncao.totalVendas += Number(c.valorVendas);
    atualFuncao.totalComissao += Number(c.valorComissao);
    atualFuncao.quantidade += 1;
    atualFuncao.comerciais.add(c.comercial.id);
    porFuncao.set(funcao, atualFuncao);

    totalGeralVendas += Number(c.valorVendas);
    totalGeralComissao += Number(c.valorComissao);
  });

  return ok({
    comissoes: comissoes.map((c) => ({
      id: c.id,
      mesReferencia: c.mesReferencia,
      comercial: {
        id: c.comercial.id,
        nome: c.comercial.nome,
        email: c.comercial.usuario.email,
        funcao: c.comercial.funcao,
      },
      valorVendas: Number(c.valorVendas),
      valorComissao: Number(c.valorComissao),
      status: c.status,
      dataPagamento: c.dataPagamento,
      createdAt: c.createdAt,
    })),
    resumo: {
      porMes: Array.from(porMes.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([mes, dados]) => ({
          mes,
          ...dados,
        })),
      porFuncao: Array.from(porFuncao.entries())
        .map(([funcao, dados]) => ({
          funcao: funcao === "SEM_FUNCAO" ? null : funcao,
          totalVendas: dados.totalVendas,
          totalComissao: dados.totalComissao,
          quantidade: dados.quantidade,
          comerciaisCount: dados.comerciais.size,
        }))
        .sort((a, b) => b.totalComissao - a.totalComissao),
      totalGeral: {
        totalVendas: totalGeralVendas,
        totalComissao: totalGeralComissao,
        quantidade: comissoes.length,
      },
    },
  });
}
