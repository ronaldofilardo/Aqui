import { prisma } from "@asa/database";
import * as XLSX from "xlsx";
import { calcularPontosDeProducao, obterCicloVigente, calcularComissaoComercial } from "@/lib/pontos-utils";
import { parseDate, parseNumber } from "./parser";
import { criarAuditLog } from "@/lib/audit";

interface ProcessUploadResult {
  upload: any;
  summary: {
    totalRows: number;
    processedRows: number;
    rejectedRows: number;
    orphanedRows: number;
    linhasComComercial: number;
    linhasSemComercial: number;
  };
}

interface RowData {
  cpf: string;
  dataRef: Date | null;
  dataPag: Date | null;
  formaPag: string;
  totalPago: number | null;
  paciente: string;
  procedimento: string;
  tipoProc: string;
  unidade: string;
  usuarioDaConta: string;
  rowIndex: number;
  uniqueKey: string;
}

interface ProcessedRow {
  isOrfao: boolean;
  comercialId: string | null;
  gestorId: string | null;
  dataRef: Date;
  totalPago: number;
  procedimento: {
    dataReferencia: Date;
    dataPagamento: Date;
    formaPagamento: string;
    totalPago: number;
    paciente: string;
    procedimento: string;
    cpf: string;
    tipoProcedimento: string;
    unidade: string;
    parceiroId: string | null;
    indicadoId: string | null;
    comercialId: string | null;
    gestorId: string | null;
    uploadId: string;
  };
}

export async function processUploadPlanilha(
  backofficeId: string,
  worksheet: any,
  fileName: string
): Promise<ProcessUploadResult> {
  const COLUNAS_PLANILHA = [
    "Data de Referência",
    "Data do Pagamento",
    "Forma de Pagamento",
    "Total Pago",
    "Paciente",
    "Procedimento",
    "CPF",
    "Tipo do Procedimento",
    "Unidade",
    "Usuário da conta",
  ] as const;

  const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", range: 0 });
  
  let startRow = 0;
  const firstRow = allRows[0];
  if (!firstRow.some((cell: any) => String(cell).includes("Data de Referência"))) {
    startRow = 1;
  }

  const headerRow = allRows[startRow];
  const dataRows = allRows.slice(startRow + 1);

  const missingCols = COLUNAS_PLANILHA.filter((col) => !headerRow.includes(col));
  if (missingCols.length > 0) {
    throw new Error(`Colunas faltando: ${missingCols.join(", ")}`);
  }

  // Parse all rows first
  const rawData = dataRows.map((row: any[]) => {
    const obj: any = {};
    headerRow.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj;
  });

  // Extrair mês de referência
  const primeiraDataRef = rawData.length > 0 ? parseDate(rawData[0]["Data de Referência"]) : new Date();
  const mesReferencia = primeiraDataRef 
    ? `${primeiraDataRef.getFullYear()}-${String(primeiraDataRef.getMonth() + 1).padStart(2, "0")}`
    : new Date().toISOString().slice(0, 7);

  const upload = await prisma.uploadPlanilhaBackoffice.create({
    data: {
      backofficeId,
      nomeArquivo: fileName,
      mesReferencia,
      totalRows: rawData.length,
    },
  });

  // Step 1: Parse and validate all rows, collect unique CPFs
  const validRows: RowData[] = [];
  const rejectedRows: number[] = [];
  const cpfsProcessados = new Set<string>();

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const rowIndex = i + startRow + 2; // Excel row (1-indexed, accounting for header)

    const dataRef = parseDate(row["Data de Referência"]);
    const dataPag = parseDate(row["Data do Pagamento"]);
    const formaPag = String(row["Forma de Pagamento"] || "").trim();
    const totalPago = parseNumber(row["Total Pago"]);
    const paciente = String(row["Paciente"] || "").trim();
    const procedimento = String(row["Procedimento"] || "").trim();
    
    const cpfRaw = String(row["CPF"] || "").replace(/["']/g, "").replace(/\D/g, "").trim();
    const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, "0");
    
    const tipoProc = String(row["Tipo do Procedimento"] || "").trim();
    const unidade = String(row["Unidade"] || "").trim();
    const usuarioDaConta = String(row["Usuário da conta"] || "").trim();

    const todosVazios = 
      (!dataRef || !dataPag) && !formaPag && !totalPago &&
      !paciente && !procedimento && !cpfRaw && !tipoProc && !unidade && !usuarioDaConta;
    
    if (todosVazios) {
      rejectedRows.push(rowIndex);
      continue;
    }

    if (!dataRef || !dataPag || !totalPago || !cpf || cpf.length !== 11 || cpf === "00000000000") {
      rejectedRows.push(rowIndex);
      continue;
    }

    const tipoLower = tipoProc.toLowerCase();
    if (tipoLower.includes("cancelamento") || tipoLower.includes("devolução") || tipoLower.includes("estorno")) {
      rejectedRows.push(rowIndex);
      continue;
    }

    if (totalPago < 0) {
      rejectedRows.push(rowIndex);
      continue;
    }

    const dataRefStr = dataRef.toISOString().split("T")[0];
    const uniqueKey = `${dataRefStr}|${cpf}|${procedimento}`;

    if (cpfsProcessados.has(uniqueKey)) {
      rejectedRows.push(rowIndex);
      continue;
    }
    cpfsProcessados.add(uniqueKey);

    validRows.push({
      cpf,
      dataRef,
      dataPag,
      formaPag,
      totalPago,
      paciente,
      procedimento,
      tipoProc,
      unidade,
      usuarioDaConta,
      rowIndex,
      uniqueKey,
    });
  }

  // Step 2: Batch fetch all indicados
  const uniqueCpfs = [...new Set(validRows.map(r => r.cpf))];
  const indicados = await prisma.indicado.findMany({
    where: { cpf: { in: uniqueCpfs } },
    include: {
      parceiro: {
        include: {
          comercial: { include: { lideranca: true } },
          gestor: { include: { lideranca: true } },
        },
      },
    },
  });

  const indicadoMap = new Map(indicados.map(i => [i.cpf, i]));

  // Step 3: Batch fetch all comerciais and gestores
  const uniqueUsuariosDaConta = [...new Set(validRows.map(r => r.usuarioDaConta).filter(Boolean))];
  
  const [comerciais, gestores] = await Promise.all([
    uniqueUsuariosDaConta.length > 0 ? prisma.comercial.findMany({
      where: {
        lideranca: { backofficeId },
        nome: { in: uniqueUsuariosDaConta, mode: "insensitive" },
      },
      select: { id: true, nome: true },
    }) : [],
    uniqueUsuariosDaConta.length > 0 ? prisma.gestor.findMany({
      where: {
        lideranca: { backofficeId },
        nome: { in: uniqueUsuariosDaConta, mode: "insensitive" },
      },
      select: { id: true, nome: true },
    }) : [],
  ]);

  const comercialMap = new Map(comerciais.map(c => [c.nome.toLowerCase(), c.id]));
  const gestorMap = new Map(gestores.map(g => [g.nome.toLowerCase(), g.id]));

  // Step 4: Process all rows with in-memory lookups
  let processedRows = 0;
  let orphanedRows = 0;
  let linhasComComercial = 0;
  let linhasSemComercial = 0;
  const procedimentos: any[] = [];
  const vendasPorComercialMes: Record<string, Record<string, number>> = {};

  for (const row of validRows) {
    const indicado = indicadoMap.get(row.cpf);

    const isOrfao = !indicado || 
      indicado.status === "DESVINCULADO" ||
      !indicado.parceiro ||
      indicado.parceiro.status === "DESLIGADO";

    let comercialId: string | null = null;
    let gestorId: string | null = null;
    let parceiroId: string | null = null;
    let indicadoId: string | null = null;

    if (!isOrfao && indicado?.parceiro) {
      parceiroId = indicado.parceiro.id;
      indicadoId = indicado.id;

      if (row.usuarioDaConta) {
        const userLower = row.usuarioDaConta.toLowerCase();
        
        // 1. Buscar Comercial
        if (comercialMap.has(userLower)) {
          comercialId = comercialMap.get(userLower)!;
        } 
        // 2. Buscar Gestor
        else if (gestorMap.has(userLower)) {
          gestorId = gestorMap.get(userLower)!;
        }
      }
    }

    const mesRef = row.dataRef!.toISOString().split("T")[0];

    if (comercialId) {
      linhasComComercial++;
      if (!vendasPorComercialMes[comercialId]) {
        vendasPorComercialMes[comercialId] = {};
      }
      vendasPorComercialMes[comercialId][mesRef] =
        (vendasPorComercialMes[comercialId][mesRef] || 0) + row.totalPago!;
    } else {
      linhasSemComercial++;
    }

    procedimentos.push({
      dataReferencia: row.dataRef,
      dataPagamento: row.dataPag,
      formaPagamento: row.formaPag,
      totalPago: Number(row.totalPago),
      paciente: row.paciente,
      procedimento: row.procedimento,
      cpf: row.cpf,
      tipoProcedimento: row.tipoProc,
      unidade: row.unidade,
      parceiroId,
      indicadoId,
      comercialId,
      gestorId,
      uploadId: upload.id,
    });

    if (isOrfao) {
      orphanedRows++;
    }
    processedRows++;
  }

  // Step 5: Batch insert procedimentos
  if (procedimentos.length > 0) {
    await prisma.procedimentoPF.createMany({
      data: procedimentos,
      skipDuplicates: true,
    });
  }

  // Step 6: Batch process pontos (collect all needed data first, then batch create)
  await processarPontosBatch(procedimentos, backofficeId);
  
  // Step 7: Batch process comissões
  await processarComissoesBatch(vendasPorComercialMes);

  await prisma.uploadPlanilhaBackoffice.update({
    where: { id: upload.id },
    data: { status: "CONCLUIDO" },
  });

  await criarAuditLog({
    usuarioId: backofficeId,
    acao: "UPLOAD_PLANILHA_PONTOS",
    entidade: "UploadPlanilhaPF",
    entidadeId: upload.id,
    detalhes: { arquivo: fileName, linhas: processedRows },
  });

  return {
    upload,
    summary: {
      totalRows: rawData.length,
      processedRows,
      rejectedRows: rejectedRows.length,
      orphanedRows,
      linhasComComercial,
      linhasSemComercial,
    },
  };
}

async function processarPontosBatch(procedimentos: any[], backofficeId: string) {
  // Collect unique parceiroIds
  const parceiroIds = [...new Set(procedimentos.filter(p => p.parceiroId).map(p => p.parceiroId!))];
  
  if (parceiroIds.length === 0) return;

  // Batch fetch parceiros with periodicidade
  const parceiros = await prisma.parceiro.findMany({
    where: { id: { in: parceiroIds } },
    select: { id: true, periodicidadeCicloEscolhida: true },
  });

  const periodicidadeMap = new Map(parceiros.map(p => [p.id, p.periodicidadeCicloEscolhida ?? "ANUAL"]));

  // Batch fetch ciclos vigentes for each periodicidade
  const periodicidades = [...new Set(periodicidadeMap.values())];
  const ciclos = await Promise.all(
    periodicidades.map(p => obterCicloVigente(backofficeId, p))
  );
  
  const cicloMap = new Map<string, string | null>();
  periodicidades.forEach((p, i) => {
    cicloMap.set(p, ciclos[i]?.id ?? null);
  });

  // Collect unique ciclos
  const cicloIds = [...new Set(cicloMap.values())].filter(Boolean) as string[];
  
  // Batch fetch configurações for each ciclo
  const configs = await Promise.all(
    cicloIds.map(cicloId => 
      prisma.configuracaoPontos.findFirst({
        where: { backofficeId },
        orderBy: { vigenteDesde: "desc" },
      })
    )
  );

  const configMap = new Map<string, string | null>();
  cicloIds.forEach((cicloId, i) => {
    configMap.set(cicloId, configs[i]?.id ?? null);
  });

  // Build movimentações
  const movimentacoes: any[] = [];

  for (const p of procedimentos) {
    if (!p.parceiroId) continue;

    const periodicidade = periodicidadeMap.get(p.parceiroId);
    const cicloId = periodicidade ? cicloMap.get(periodicidade) ?? null : null;
    if (!cicloId) continue;

    const configId = configMap.get(cicloId);
    if (!configId) continue;

    const pontos = await calcularPontosDeProducao(
      p.totalPago,
      p.tipoProcedimento,
      p.procedimento,
    );

    if (pontos > 0) {
      movimentacoes.push({
        cicloPontosId: cicloId,
        parceiroId: p.parceiroId,
        tipo: "CREDITO",
        origem: "PRODUCAO_IMPORTADA",
        quantidade: pontos,
        descricao: `Pontos por produção importada - ${p.procedimento}`,
      });
    }
  }

  // Batch create movimentações
  if (movimentacoes.length > 0) {
    await prisma.movimentacaoPontos.createMany({
      data: movimentacoes,
      skipDuplicates: true,
    });
  }
}

async function processarComissoesBatch(
  vendasPorComercialMes: Record<string, Record<string, number>>
) {
  const promises: Promise<any>[] = [];

  for (const [comercialId, vendasPorMes] of Object.entries(vendasPorComercialMes)) {
    for (const [mesRef, totalVendas] of Object.entries(vendasPorMes)) {
      const [ano, mes] = mesRef.split("-");
      promises.push(
        calcularComissaoComercial({
          comercialId,
          valorProcedimento: totalVendas,
          dataReferencia: new Date(Number(ano), Number(mes) - 1, 1)
        })
      );
    }
  }

  // Execute all comissão calculations in parallel
  await Promise.all(promises);
}