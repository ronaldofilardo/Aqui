import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok } from "@/lib/api-helpers";
import * as XLSX from "xlsx";

// Colunas esperadas (ordem não importa)
const COLUNAS_OBRIGATORIAS = [
  "Data de Referência",
  "Data do Pagamento",
  "Forma de Pagamento",
  "Total Pago",
  "Paciente",
  "Procedimento",
  "CPF",
  "Tipo do Procedimento",
  "Unidade",
  "Usuário da conta", // Obrigatório para identificar o comercial
];

const COLUNAS_OPCIONAIS = [
  "Desconto",
  "Acréscimo",
  "Valor Produzido",
  "Total Bruto",
  "Quantidade",
  "Prontuário",
  "Matrícula",
  "Data Removida",
];

interface RowData {
  [key: string]: any;
}

function parseDate(value: string | number | Date | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }
  const parsed = new Date(value as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(value: string | number | undefined): number | null {
  if (typeof value === "number") return value;
  if (!value || value === "") return null;
  
  const str = String(value);
  
  // Tentar formato brasileiro: "17,03" ou "1.234,56"
  if (str.includes(",")) {
    const cleaned = str.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  
  // Tentar formato americano: "17.03" ou "1,234.56"
  const cleaned = str.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

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
  status: "VALIDO" | "ORFÃO" | "REJEITADO";
  motivo?: string;
  parceiroNome?: string;
  comercialNome?: string;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return badRequest("Arquivo é obrigatório");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para array de arrays para ter mais controle
    const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Retorna como array de arrays
      defval: "",
      range: 0 // Ler todas as linhas desde o início
    });
    
    if (allRows.length < 2) {
      return badRequest("Planilha vazia ou sem dados suficientes");
    }

    // Verificar se a primeira linha é um título (não contém as colunas esperadas)
    let startRow = 0;
    const firstRow = allRows[0] as string[];
    if (!firstRow.some(cell => String(cell).includes("Data de Referência"))) {
      startRow = 1; // Pular título
    }
    
    // Linha do cabeçalho e dados
    const headerRow = allRows[startRow] as string[];
    const dataRows = allRows.slice(startRow + 1); // Dados começam após o cabeçalho
    
    // Criar objeto de mapeamento de colunas
    const colunasEncontradas = headerRow.map((h, i) => ({ nome: String(h).trim(), indice: i }))
      .filter(c => c.nome.length > 0);
    
    const colunasMap: Record<string, number> = {};
    colunasEncontradas.forEach(col => {
      colunasMap[col.nome] = col.indice;
    });

    console.log("[Preview] Cabeçalho:", headerRow);
    console.log("[Preview] Total de linhas de dados:", dataRows.length);
    console.log("[Preview] Colunas encontradas:", colunasEncontradas.map(c => c.nome));

    // Validar colunas obrigatórias
    const colunasFaltantes = COLUNAS_OBRIGATORIAS.filter(
      (col) => !(col in colunasMap)
    );

    if (colunasFaltantes.length > 0) {
      return badRequest(
        `Colunas obrigatórias faltando: ${colunasFaltantes.join(", ")}. ` +
        `Colunas encontradas: ${colunasEncontradas.map(c => c.nome).join(", ")}`
      );
    }

    console.log("[Preview] Todas as colunas obrigatórias encontradas");

    const previewRows: PreviewRow[] = [];
    const cpfsProcessados = new Set<string>();
    let totalValido = 0;
    let totalOrfao = 0;
    let totalRejeitado = 0;
    let totalGeral = 0;

    // Processar cada linha de dados
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 3; // Linha 1=título, Linha 2=cabeçalho, Dados começam na linha 3
      totalGeral++;

      // Acessar colunas pelo índice
      const dataRef = parseDate(row[colunasMap["Data de Referência"]]);
      const dataPag = parseDate(row[colunasMap["Data do Pagamento"]]);
      const formaPag = String(row[colunasMap["Forma de Pagamento"]] || "").trim();
      const totalPago = parseNumber(row[colunasMap["Total Pago"]]);
      const paciente = String(row[colunasMap["Paciente"]] || "").trim();
      const procedimento = String(row[colunasMap["Procedimento"]] || "").trim();
      
      // Limpar CPF de forma robusta
      const cpfRaw = String(row[colunasMap["CPF"]] || "")
        .replace(/["']/g, "")
        .replace(/\D/g, "")
        .trim();
      const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, "0");
      
      const tipoProc = String(row[colunasMap["Tipo do Procedimento"]] || "").trim();
      const unidade = String(row[colunasMap["Unidade"]] || "").trim();
      const usuarioDaConta = String(row[colunasMap["Usuário da conta"]] || "").trim();

      // Pular linhas completamente vazias (apenas espaços em branco na planilha)
      if (
        !row[colunasMap["Data de Referência"]] &&
        !row[colunasMap["Data do Pagamento"]] &&
        !row[colunasMap["Forma de Pagamento"]] &&
        !row[colunasMap["Total Pago"]] &&
        !row[colunasMap["Paciente"]] &&
        !row[colunasMap["Procedimento"]] &&
        !row[colunasMap["CPF"]] &&
        !row[colunasMap["Tipo do Procedimento"]] &&
        !row[colunasMap["Unidade"]] &&
        !row[colunasMap["Usuário da conta"]]
      ) {
        continue;
      }

      // Validações básicas
      if (!dataRef || !dataPag || !totalPago || !cpf || cpf.length !== 11 || cpf === "00000000000") {
        previewRows.push({
          rowNumber,
          dataReferencia: dataRef?.toISOString().split("T")[0] || "",
          paciente,
          procedimento,
          cpf,
          tipoProcedimento: tipoProc,
          totalPago: totalPago || 0,
          unidade,
          usuarioDaConta,
          status: "REJEITADO",
          motivo: `Dados inválidos - CPF: ${cpf}, Data Ref: ${dataRef?.toISOString().split("T")[0] || "N/A"}, Valor: ${totalPago}`,
        });
        totalRejeitado++;
        continue;
      }

      // Verificar cancelamentos/devoluções
      const tipoLower = tipoProc.toLowerCase();
      if (
        tipoLower.includes("cancelamento") ||
        tipoLower.includes("devolução") ||
        tipoLower.includes("estorno") ||
        tipoLower.includes("devolucao")
      ) {
        previewRows.push({
          rowNumber,
          dataReferencia: dataRef.toISOString().split("T")[0],
          paciente,
          procedimento,
          cpf,
          tipoProcedimento: tipoProc,
          totalPago: Number(totalPago),
          unidade,
          usuarioDaConta,
          status: "REJEITADO",
          motivo: "Cancelamento/Devolução/Estorno",
        });
        totalRejeitado++;
        continue;
      }

      // Verificar valor negativo
      if (totalPago < 0) {
        previewRows.push({
          rowNumber,
          dataReferencia: dataRef.toISOString().split("T")[0],
          paciente,
          procedimento,
          cpf,
          tipoProcedimento: tipoProc,
          totalPago: Number(totalPago),
          unidade,
          usuarioDaConta,
          status: "REJEITADO",
          motivo: "Valor negativo",
        });
        totalRejeitado++;
        continue;
      }

      // Verificar duplicidade - mesma data, paciente, procedimento e unidade
      const uniqueKey = `${dataRef.toISOString().split("T")[0]}|${paciente}|${procedimento}|${unidade}`;
      if (cpfsProcessados.has(uniqueKey)) {
        previewRows.push({
          rowNumber,
          dataReferencia: dataRef.toISOString().split("T")[0],
          paciente,
          procedimento,
          cpf,
          tipoProcedimento: tipoProc,
          totalPago: Number(totalPago),
          unidade,
          usuarioDaConta,
          status: "REJEITADO",
          motivo: "Linha duplicada",
        });
        totalRejeitado++;
        continue;
      }
      cpfsProcessados.add(uniqueKey);

      // Buscar indicado no banco
      const indicado = await prisma.indicado.findUnique({
        where: { cpf },
        include: {
          parceiro: {
            include: { gestorPf: true },
          },
        },
      });

      // Verificar se é órfão (sem parceiro vinculado)
      const isOrfao = !indicado || 
        indicado.status === "DESVINCULADO" ||
        !indicado.parceiro ||
        indicado.parceiro.status === "DESLIGADO";

      // Identificar comercial
      let comercialNome: string | undefined;
      let parceiroNome: string | undefined;
      
      if (!isOrfao && indicado?.parceiro) {
        parceiroNome = indicado.parceiro.nome;
        
        if (usuarioDaConta) {
          const comercial = await prisma.comercial.findFirst({
            where: {
              gestorPfId: indicado.parceiro.gestorPfId,
              nome: {
                contains: usuarioDaConta,
                mode: "insensitive",
              },
            },
            select: { nome: true },
          });
          comercialNome = comercial?.nome;
        }
      }

      // Linha válida (mesmo que seja órfã)
      previewRows.push({
        rowNumber,
        dataReferencia: dataRef.toISOString().split("T")[0],
        paciente,
        procedimento,
        cpf,
        tipoProcedimento: tipoProc,
        totalPago: Number(totalPago),
        unidade,
        usuarioDaConta,
        status: isOrfao ? "ORFÃO" : "VALIDO",
        motivo: isOrfao ? "CPF não possui parceiro ativo vinculado" : undefined,
        parceiroNome,
        comercialNome,
      });
      
      if (isOrfao) {
        totalOrfao++;
      } else {
        totalValido++;
      }
    }

    const summary = {
      total: totalGeral,
      validos: totalValido,
      orfaos: totalOrfao,
      rejeitados: totalRejeitado,
      totalComissao: previewRows
        .filter((r) => r.status === "VALIDO")
        .reduce((sum, r) => sum + r.totalPago, 0),
      colunasEncontradas: colunasEncontradas.map(c => c.nome),
      colunasObrigatorias: COLUNAS_OBRIGATORIAS,
      colunasOpcionais: COLUNAS_OPCIONAIS.filter(col => colunasEncontradas.some(c => c.nome === col)),
    };

    console.log("[Preview] Summary:", summary);

    return ok({
      fileName: file.name,
      previewRows: previewRows.slice(0, 100), // Limitar a 100 linhas no preview
      hasMore: previewRows.length > 100,
      totalRows: previewRows.length,
      summary,
    });
  } catch (error) {
    console.error("[preview] Erro ao processar arquivo:", error);
    return badRequest("Erro ao processar arquivo: " + (error as any).message);
  }
}