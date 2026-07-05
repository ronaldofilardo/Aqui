import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calcula pontos baseado em produção, configuração vigente e tipo de arredondamento
 */
export async function calcularPontosDeProducao(
  totalPago: number | Decimal,
  dataReferencia: Date,
  gestorPfId: string,
): Promise<number> {
  const config = await prisma.configuracaoPontos.findFirst({
    where: {
      gestorPfId,
      vigenteDesde: { lte: dataReferencia },
      OR: [{ vigenteAte: null }, { vigenteAte: { gte: dataReferencia } }],
    },
    orderBy: { vigenteDesde: "desc" },
  });

  if (!config) {
    throw new Error(
      "Configuração de pontos não encontrada para a data de referência",
    );
  }

  const totalPagoNum =
    typeof totalPago === "number" ? totalPago : totalPago.toNumber();
  let pontos = totalPagoNum / config.valorPorPonto.toNumber();

  // Aplicar arredondamento
  if (config.tipoArredondamento === "PISO") {
    pontos = Math.floor(pontos);
  } else if (config.tipoArredondamento === "TETO") {
    pontos = Math.ceil(pontos);
  } else {
    pontos = Math.round(pontos);
  }

  return Math.max(0, pontos);
}

/**
 * Obtém o ciclo de pontos vigente (EM_ANDAMENTO ou RESGATE_ABERTO)
 * Se `periodicidade` for informada, filtra também por ela, para que ciclos
 * SEMESTRAL e ANUAL possam coexistir.
 */
export async function obterCicloVigente(
  gestorPfId: string,
  periodicidade?: "SEMESTRAL" | "ANUAL",
) {
  const agora = new Date();

  return prisma.cicloPontos.findFirst({
    where: {
      gestorPfId,
      ...(periodicidade ? { periodicidade } : {}),
      OR: [
        { status: "EM_ANDAMENTO" },
        {
          status: "RESGATE_ABERTO",
        },
      ],
    },
  });
}

/**
 * Calcula saldo de pontos do parceiro em um ciclo específico
 */
export async function calcularSaldoPontos(
  parceiroId: string,
  cicloPontosId: string,
): Promise<number> {
  const movimentacoes = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
    },
  });

  const somaCreditos = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "CREDITO",
    },
  });

  const somaDebitos = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "DEBITO",
    },
  });

  const somaEstornos = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "ESTORNO",
    },
  });

  const creditos = somaCreditos._sum.quantidade || 0;
  const debitos = somaDebitos._sum.quantidade || 0;
  const estornos = somaEstornos._sum.quantidade || 0;

  return creditos - debitos + estornos;
}

/**
 * Valida se CPF já existe na BaseClientesAcessoSaude
 */
export async function cpfExisteEmAcessoSaude(cpf: string): Promise<boolean> {
  const cliente = await prisma.baseClientesAcessoSaude.findUnique({
    where: { cpf },
  });
  return !!cliente;
}

/**
 * Normaliza CPF removendo máscara
 */
export function normalizarCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = normalizarCPF(cpf);

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpfLimpo.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
}

/**
 * Mapeia função do comercial para o campo correspondente em RegrasGestores
 */
function getCampoRegraGestor(funcao: string): string | null {
  const mapeamento: Record<string, string> = {
    GERENTE_CIRE: "gerenteCire",
    SUPERVISOR_ATIVO: "supervisorAtivo",
    SUPERVISOR_RECEPTIVO: "supervisorReceptivo",
    SUPERVISOR_FRANQUIA: "supervisorFranquia",
    SUPERVISOR_ATENDIMENTO: "supervisorAtendimento",
    GERENTE_ATENDIMENTO: "gerenteAtendimento",
    SUPERVISOR_COMERCIAL: "supervisorComercial",
  };
  return mapeamento[funcao] || null;
}

/**
 * Mapeia função do comercial para o campo correspondente em RegrasComerciais
 * (baseado no tipo de procedimento/unidade)
 */
function getCampoRegraComercial(tipoProcedimento?: string): string {
  // Padrão: usa 'unidade' como default
  // Pode ser expandido para outros tipos no futuro
  return "unidade";
}

/**
 * Calcula comissão de um comercial baseado nas regras:
 * - RegrasComerciais (percentual por tipo de procedimento)
 * - RegrasGestores (percentual por função)
 * - Função do comercial
 * 
 * Fórmula: valorProcedimento × (regraComercial/100) × (regraGestor/100)
 */
export async function calcularComissaoComercial(params: {
  comercialId: string;
  valorProcedimento: number;
  dataReferencia: Date;
  tipoProcedimento?: string;
}): Promise<{
  valorComissao: number;
  percentualAplicado: number;
  detalhamento: {
    regraComercialPercentual: number;
    regraGestorPercentual: number;
    funcaoComercial: string | null;
  };
}> {
  const { comercialId, valorProcedimento, dataReferencia, tipoProcedimento } = params;

  // Busca dados do comercial com função
  const comercial = await prisma.comercial.findUnique({
    where: { id: comercialId },
    select: {
      funcao: true,
      gestorPfId: true,
    },
  });

  if (!comercial) {
    throw new Error("Comercial não encontrado");
  }

  const { funcao, gestorPfId } = comercial;

  // Busca regras comerciais
  const regraComercial = await prisma.regraComercial.findUnique({
    where: { gestorPfId },
  });

  // Busca regras de gestores
  const regraGestor = await prisma.regraGestor.findUnique({
    where: { gestorPfId },
  });

  // Se não houver regras, retorna comissão zero
  if (!regraComercial || !regraGestor) {
    return {
      valorComissao: 0,
      percentualAplicado: 0,
      detalhamento: {
        regraComercialPercentual: 0,
        regraGestorPercentual: 0,
        funcaoComercial: funcao,
      },
    };
  }

  // Obtém percentual das regras comerciais
  const campoRegraComercial = getCampoRegraComercial(tipoProcedimento);
  const percentualComercial = Number(
    regraComercial[campoRegraComercial as keyof typeof regraComercial] || 0,
  );

  // Obtém percentual das regras de gestores baseado na função
  let percentualGestor = 0;
  if (funcao) {
    const campoRegraGestor = getCampoRegraGestor(funcao);
    if (campoRegraGestor) {
      percentualGestor = Number(
        regraGestor[campoRegraGestor as keyof typeof regraGestor] || 0,
      );
    }
  }

  // Calcula comissão: valor × (regraComercial/100) × (regraGestor/100)
  const valorComissao = Number(
    (valorProcedimento * (percentualComercial / 100) * (percentualGestor / 100)).toFixed(2),
  );

  const percentualAplicado = Number(
    ((percentualComercial / 100) * (percentualGestor / 100) * 100).toFixed(2),
  );

  return {
    valorComissao,
    percentualAplicado,
    detalhamento: {
      regraComercialPercentual: percentualComercial,
      regraGestorPercentual: percentualGestor,
      funcaoComercial: funcao,
    },
  };
}
