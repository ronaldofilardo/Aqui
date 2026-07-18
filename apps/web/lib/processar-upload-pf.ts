import { prisma } from "@asa/database";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { read, utils } from "xlsx";

const UPLOAD_DIR = join(process.cwd(), "uploads", "backoffice");

/**
 * Processa upload de planilha PF em background
 */
export async function processarUploadPlanilhaPF(
  uploadId: string,
  file: File,
  backofficeId: string
): Promise<void> {
  try {
    // Salvar arquivo temporariamente
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}-${safeName}`;
    const filePath = join(UPLOAD_DIR, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Ler planilha
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

    console.log("[processarUploadPlanilhaPF] Total de linhas:", jsonData.length);
    console.log("[processarUploadPlanilhaPF] Linha 1:", jsonData[0]);
    console.log("[processarUploadPlanilhaPF] Linha 2 (cabeçalhos):", jsonData[1]);

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
    
    console.log("[processarUploadPlanilhaPF] Headers mapeados:", headers);
    
    const colunasEncontradas = Object.values(headers).map((h) =>
      h.toLowerCase()
    );

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

    const comercialIds = comerciais.map((c) => c.id);
    const gestorIds = gestores.map((g) => g.id);

    // Buscar parceiros do backoffice com seus indicados
    const parceiros = await prisma.parceiro.findMany({
      where: {
        OR: [
          { comercialId: { in: comercialIds } },
          { gestorId: { in: gestorIds } },
        ],
      },
      select: { 
        id: true, 
        nome: true, 
        cpf: true, 
        comercialId: true, 
        gestorId: true,
        indicacoes: {
          select: {
            id: true,
            cpf: true,
          }
        }
      },
    });

    console.log("[processarUploadPlanilhaPF] Parceiros encontrados:", parceiros.length);
    console.log("[processarUploadPlanilhaPF] Total de indicados:", parceiros.reduce((sum, p) => sum + p.indicacoes.length, 0));

    // Processar linhas (começa do índice 2 para pular título e cabeçalho)
    let totalRows = 0;
    let processedRows = 0;
    let rejectedRows = 0;
    let orphanedRows = 0;

    const procedimentosToCreate: any[] = [];

    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || Object.keys(row).length === 0) continue;

      totalRows++;

      const dataReferenciaRaw = row[idxDataRef];
      const paciente = String(row[idxPaciente] || "").trim();
      const cpfRaw = String(row[idxCpf] || "").trim();
      const procedimento = String(row[idxProcedimento] || "").trim();
      const totalPagoRaw = row[idxTotalPago];
      const usuarioDaConta = String(row[idxUsuarioConta] || "").trim();
      const unidade = idxUnidade >= 0 ? String(row[idxUnidade] || "").trim() : "NÃO INFORMADA";
      const tipoProcedimento =
        idxTipoProcedimento >= 0
          ? String(row[idxTipoProcedimento] || "").trim()
          : "PARTICULAR";
      const formaPagamento =
        idxFormaPagamento >= 0
          ? String(row[idxFormaPagamento] || "").trim()
          : "PARTICULAR";

      // Validar dados
      let rejected = false;
      let orphaned = false;

      // Validar CPF
      const cpf = cpfRaw.replace(/\D/g, "");
      if (!cpf || cpf.length !== 11) {
        rejected = true;
        rejectedRows++;
      }

      // Validar data
      let dataReferencia: Date | null = null;
      if (!dataReferenciaRaw) {
        rejected = true;
        rejectedRows++;
      } else {
        dataReferencia = parseDate(dataReferenciaRaw);
        if (!dataReferencia) {
          rejected = true;
          rejectedRows++;
        }
      }

      // Validar total pago
      let totalPago: number = 0;
      if (
        totalPagoRaw === null ||
        totalPagoRaw === undefined ||
        isNaN(Number(totalPagoRaw))
      ) {
        rejected = true;
        rejectedRows++;
      } else {
        totalPago = Number(totalPagoRaw);
      }

      // Validar paciente e procedimento
      if (!paciente || !procedimento) {
        rejected = true;
        rejectedRows++;
      }

      if (rejected) {
        continue;
      }

      // Verificar se é órfão (não tem parceiro/indicado)
      let parceiroEncontrado = null;
      let indicadoId: string | null = null;
      
      // Primeiro tenta achar pelo CPF do parceiro
      parceiroEncontrado = parceiros.find((p) => p.cpf === cpf);
      
      // Se não achou, procura entre os indicados de todos os parceiros
      if (!parceiroEncontrado) {
        for (const parceiro of parceiros) {
          const indicado = parceiro.indicacoes.find((ind) => ind.cpf === cpf);
          if (indicado) {
            parceiroEncontrado = parceiro;
            indicadoId = indicado.id;
            break;
          }
        }
      }

      if (!parceiroEncontrado) {
        orphaned = true;
        orphanedRows++;
        continue;
      }

      // Calcular comissão (será processada pelas regras do sistema posteriormente)
      const valorComissao = 0;

      // Extrair mês de referência da data
      const mesReferencia = dataReferencia 
        ? `${dataReferencia.getFullYear()}-${String(dataReferencia.getMonth() + 1).padStart(2, "0")}`
        : '';

      procedimentosToCreate.push({
        dataReferencia,
        dataPagamento: new Date(),
        formaPagamento,
        totalPago,
        paciente,
        procedimento,
        cpf,
        tipoProcedimento,
        unidade,
        indicadoId,
        parceiroId: parceiroEncontrado.id,
        uploadId,
        valorComissao,
        statusComissao: "PENDENTE",
        comercialId: parceiroEncontrado.comercialId,
        gestorId: parceiroEncontrado.gestorId,
      });

      processedRows++;
    }

    // Criar procedimentos em batch
    if (procedimentosToCreate.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < procedimentosToCreate.length; i += BATCH_SIZE) {
        const batch = procedimentosToCreate.slice(i, i + BATCH_SIZE);
        await prisma.procedimentoPF.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    // Atualizar status do upload
    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: {
        status: "CONCLUIDO",
        totalRows,
        processedRows,
        rejectedRows,
        orphanedRows,
      },
    });

    console.log(`[processarUploadPlanilhaPF] Upload ${uploadId} processado: ${processedRows} procedimentos criados`);
  } catch (error) {
    console.error("[processarUploadPlanilhaPF] Erro:", error);
    await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: { status: "ERRO" },
    });
    throw error;
  }
}

function parseDate(dateRaw: any): Date | null {
  if (!dateRaw) return null;

  // Se for objeto Date do Excel
  if (typeof dateRaw === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(
      excelEpoch.getTime() + dateRaw * 24 * 60 * 60 * 1000
    );
  }

  // Se for string
  const str = String(dateRaw).trim();

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
        const [, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      } else if (pattern === patterns[1]) {
        return new Date(str);
      } else if (pattern === patterns[2]) {
        const [, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
    }
  }

  // Tentar Date.parse
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}
