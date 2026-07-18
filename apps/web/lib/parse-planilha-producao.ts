import { prisma } from "@asa/database";
import { read, utils } from "xlsx";

interface PreviewRow {
  rowNumber: number;
  dataReferencia: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  totalPago: number;
  unidade: string;
  usuarioDaConta: string;
  valorComissao?: number;
  status: "VALIDO" | "ORFAO" | "REJEITADO";
  motivo?: string;
  parceiroNome?: string;
  comercialNome?: string;
  gestorNome?: string;
}

interface ParseResult {
  fileName: string;
  previewRows: PreviewRow[];
  hasMore: boolean;
  totalRows: number;
  summary: {
    total: number;
    validos: number;
    orfaos: number;
    rejeitados: number;
    totalComissao: number;
    colunasEncontradas: string[];
    colunasObrigatorias: string[];
    colunasOpcionais: string[];
  };
}

const COLUNAS_OBRIGATORIAS = [
  "Data de Referência",
  "Paciente",
  "CPF",
  "Procedimento",
  "Total Pago",
  "Usuário da conta",
];

const COLUNAS_OPCIONAIS = [
  "Forma Pagamento",
  "Unidade",
  "Tipo Procedimento",
];

export async function parsePlanilhaProducao(
  file: File,
  backofficeId: string
): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter planilha para array de arrays
  const jsonData: any[][] = utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: "",
    raw: false 
  });

  console.log("[parsePlanilhaProducao] Total de linhas:", jsonData.length);
  console.log("[parsePlanilhaProducao] Linha 1:", jsonData[0]);
  console.log("[parsePlanilhaProducao] Linha 2 (cabeçalhos):", jsonData[1]);

  if (!jsonData || jsonData.length < 2) {
    throw new Error("Planilha vazia ou sem cabeçalhos");
  }

  // Cabeçalhos estão na linha 2 (índice 1)
  const headersRaw = jsonData[1] || [];
  const headers = headersRaw.reduce((acc, h, idx) => {
    const headerStr = h ? String(h).trim() : "";
    if (headerStr) {
      acc[String(idx)] = headerStr;
    }
    return acc;
  }, {} as Record<string, string>);

  console.log("[parsePlanilhaProducao] Headers mapeados:", headers);
  
  const colunasEncontradas = Object.values(headers).map((h) =>
    h.toLowerCase()
  );

  console.log("[parsePlanilhaProducao] Colunas encontradas:", colunasEncontradas);

  // Validar colunas obrigatórias
  const colunasObrigatoriasEncontradas = COLUNAS_OBRIGATORIAS.filter((col) =>
    colunasEncontradas.includes(col.toLowerCase())
  );

  if (colunasObrigatoriasEncontradas.length !== COLUNAS_OBRIGATORIAS.length) {
    const faltantes = COLUNAS_OBRIGATORIAS.filter(
      (col) => !colunasEncontradas.includes(col.toLowerCase())
    );
    throw new Error(
      `Colunas obrigatórias faltando: ${faltantes.join(", ")}`
    );
  }

  // Mapear índices das colunas
  const getColIndex = (nome: string) =>
    Object.values(headers).findIndex(
      (h) => String(h).trim().toLowerCase() === nome.toLowerCase()
    );

  const idxDataRef = getColIndex("Data de Referência");
  const idxPaciente = getColIndex("Paciente");
  const idxCpf = getColIndex("CPF");
  const idxProcedimento = getColIndex("Procedimento");
  const idxTotalPago = getColIndex("Total Pago");
  const idxUsuarioConta = getColIndex("Usuário da conta");
  const idxUnidade = getColIndex("Unidade");
  const idxTipoProcedimento = getColIndex("Tipo Procedimento");
  const idxFormaPagamento = getColIndex("Forma Pagamento");

  // Buscar parceiros do backoffice
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    select: { id: true },
  });
  const liderancaIds = liderancas.map((l) => l.id);

  console.log("[parsePlanilhaProducao] Backoffice ID:", backofficeId);
  console.log("[parsePlanilhaProducao] Lideranças encontradas:", liderancas.length);
  console.log("[parsePlanilhaProducao] IDs das lideranças:", liderancaIds);

  const [comerciais, gestores] = await Promise.all([
    prisma.comercial.findMany({
      where: { liderancaId: { in: liderancaIds } },
      select: { id: true, nome: true },
    }),
    prisma.gestor.findMany({
      where: { liderancaId: { in: liderancaIds } },
      select: { id: true, nome: true },
    }),
  ]);

  console.log("[parsePlanilhaProducao] Comerciais encontrados:", comerciais.length);
  console.log("[parsePlanilhaProducao] Gestores encontrados:", gestores.length);

  const comercialIds = comerciais.map((c) => c.id);
  const gestorIds = gestores.map((g) => g.id);

  // Buscar parceiros do backoffice
  const parceiros = await prisma.parceiro.findMany({
    where: comercialIds.length > 0 || gestorIds.length > 0 ? {
      OR: [
        { comercialId: { in: comercialIds } },
        { gestorId: { in: gestorIds } },
      ],
    } : {},
    select: { 
      id: true, 
      nome: true, 
      cpf: true, 
      comercial: true, 
      gestor: true,
      indicacoes: {
        select: {
          id: true,
          cpf: true,
          nome: true,
        }
      }
    },
  });

  console.log("[parsePlanilhaProducao] Parceiros encontrados:", parceiros.length);
  console.log("[parsePlanilhaProducao] Total de indicados:", parceiros.reduce((sum, p) => sum + p.indicacoes.length, 0));
  if (parceiros.length > 0) {
    console.log("[parsePlanilhaProducao] Exemplo de parceiro:", parceiros[0]);
    console.log("[parsePlanilhaProducao] Exemplo de indicado:", parceiros[0]?.indicacoes[0]);
  }

  // Processar linhas (começa do índice 2 para pular título e cabeçalho)
  const previewRows: PreviewRow[] = [];
  let totalValidos = 0;
  let totalOrfaos = 0;
  let totalRejeitados = 0;

  const MAX_PREVIEW_ROWS = 100;

  for (let i = 2; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || Object.keys(row).length === 0) continue;

    const rowNumber = i + 1; // Número da linha na planilha (1-indexed)
    const dataReferenciaRaw = row[idxDataRef];
    const paciente = String(row[idxPaciente] || "").trim();
    const cpfRaw = String(row[idxCpf] || "").trim();
    const procedimento = String(row[idxProcedimento] || "").trim();
    const totalPagoRaw = row[idxTotalPago];
    const usuarioDaConta = String(row[idxUsuarioConta] || "").trim();
    const unidade = idxUnidade >= 0 ? String(row[idxUnidade] || "").trim() : "";
    const tipoProcedimento =
      idxTipoProcedimento >= 0
        ? String(row[idxTipoProcedimento] || "").trim()
        : "PARTICULAR";
    const formaPagamento =
      idxFormaPagamento >= 0
        ? String(row[idxFormaPagamento] || "").trim()
        : "PARTICULAR";

    // Validar dados
    let status: "VALIDO" | "ORFAO" | "REJEITADO" = "VALIDO";
    let motivo: string | undefined;

    // Validar CPF
    const cpf = cpfRaw.replace(/\D/g, "");
    if (!cpf || cpf.length !== 11) {
      status = "REJEITADO";
      motivo = "CPF inválido";
    }

    // Validar data
    let dataReferencia: string | null = null;
    if (!dataReferenciaRaw) {
      status = "REJEITADO";
      motivo = "Data de referência ausente";
    } else {
      dataReferencia = parseData(dataReferenciaRaw);
      if (!dataReferencia) {
        status = "REJEITADO";
        motivo = "Data de referência inválida";
      }
    }

    // Validar total pago
    let totalPago: number = 0;
    if (
      totalPagoRaw === null ||
      totalPagoRaw === undefined ||
      isNaN(Number(totalPagoRaw))
    ) {
      status = "REJEITADO";
      motivo = "Total pago inválido";
    } else {
      totalPago = Number(totalPagoRaw);
    }

    // Validar paciente
    if (!paciente) {
      status = "REJEITADO";
      motivo = motivo ? `${motivo}; Paciente ausente` : "Paciente ausente";
    }

    // Validar procedimento
    if (!procedimento) {
      status = "REJEITADO";
      motivo = motivo ? `${motivo}; Procedimento ausente` : "Procedimento ausente";
    }

    // Verificar se é órfão (não tem parceiro/indicado)
    let parceiroEncontrado: any | undefined;
    let indicadoEncontrado: any | undefined;

    if (status === "VALIDO") {
      // Primeiro tenta achar pelo CPF do parceiro
      parceiroEncontrado = parceiros.find((p) => p.cpf === cpf);
      
      // Se não achou, procura entre os indicados de todos os parceiros
      if (!parceiroEncontrado) {
        for (const parceiro of parceiros) {
          indicadoEncontrado = parceiro.indicacoes.find((ind) => ind.cpf === cpf);
          if (indicadoEncontrado) {
            parceiroEncontrado = parceiro;
            break;
          }
        }
      }

      if (!parceiroEncontrado) {
        status = "ORFAO";
        motivo = "Parceiro não encontrado";
      }
    }

    // Contabilizar
    if (status === "VALIDO") {
      totalValidos++;
    } else if (status === "ORFAO") {
      totalOrfaos++;
    } else {
      totalRejeitados++;
    }

    // Adicionar ao preview (limitado)
    if (previewRows.length < MAX_PREVIEW_ROWS) {
      previewRows.push({
        rowNumber,
        dataReferencia: dataReferencia ?? String(dataReferenciaRaw),
        paciente,
        cpf,
        procedimento,
        tipoProcedimento,
        totalPago,
        unidade: unidade || "NÃO INFORMADA",
        usuarioDaConta,
        status,
        motivo,
        parceiroNome: parceiroEncontrado?.nome,
        comercialNome: parceiroEncontrado?.comercial?.nome,
        gestorNome: parceiroEncontrado?.gestor?.nome,
        valorComissao: 0,
      });
    }
  }

  // Total de linhas de dados (exclui linha 1=título e linha 2=cabeçalho)
  const totalLinhasDados = Math.max(0, jsonData.length - 2);

  return {
    fileName: file.name,
    previewRows,
    hasMore: totalLinhasDados > MAX_PREVIEW_ROWS,
    totalRows: totalLinhasDados,
    summary: {
      total: totalLinhasDados,
      validos: totalValidos,
      orfaos: totalOrfaos,
      rejeitados: totalRejeitados,
      totalComissao: 0,
      colunasEncontradas: Object.values(headers).map((h) => String(h).trim()),
      colunasObrigatorias: COLUNAS_OBRIGATORIAS,
      colunasOpcionais: COLUNAS_OPCIONAIS,
    },
  };
}

function parseData(dataRaw: any): string | null {
  if (!dataRaw) return null;

  // Se for objeto Date do Excel
  if (typeof dataRaw === "number") {
    // Data serial do Excel
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(
      excelEpoch.getTime() + dataRaw * 24 * 60 * 60 * 1000
    );
    return formatDate(date);
  }

  // Se for string
  const str = String(dataRaw).trim();

  // Tentar parsear vários formatos
  const patterns = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        // DD/MM/YYYY
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      } else if (pattern === patterns[1]) {
        // YYYY-MM-DD
        return str;
      } else if (pattern === patterns[2]) {
        // DD-MM-YYYY
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Tentar Date.parse
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return formatDate(date);
  }

  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}