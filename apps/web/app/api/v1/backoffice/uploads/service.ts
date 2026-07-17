import { prisma } from "@asa/database";
import * as XLSX from "xlsx";
import {
  calcularPontosDeProducao,
  obterCicloVigente,
  calcularComissaoComercial,
} from "@/lib/pontos-utils";
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

const BATCH_SIZE = 100;

export async function processUploadPlanilha(
  backofficeId: string,
  worksheet: any,
  fileName: string,
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

  const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    range: 0,
  });

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

  const rawData = dataRows.map((row: any[]) => {
    const obj: any = {};
    headerRow.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj;
  });

  // Extrair mês de referência da primeira linha
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

  // PASSO 1: Validar e normalizar todas as linhas (sem queries)
  const cpfsProcessados = new Set<string>();
  const linhasValidas: any[] = [];
  let rejectedRows = 0;

  for (const row of rawData) {
    const normalizado = normalizarLinha(row);
    if (!normalizado) {
      rejectedRows++;
      continue;
    }

    const uniqueKey = `${normalizado.dataRefStr}|${normalizado.cpf}|${normalizado.procedimento}`;
    if (cpfsProcessados.has(uniqueKey)) {
      rejectedRows++;
      continue;
    }
    cpfsProcessados.add(uniqueKey);

    linhasValidas.push(normalizado);
  }

  console.log(`[Upload] ${linhasValidas.length} linhas válidas de ${rawData.length}`);

  // PASSO 2: Coletar todos os CPFs únicos e buscar em batch
  const cpfsUnicos = Array.from(new Set(linhasValidas.map((l) => l.cpf)));

  const indicados = await prisma.indicado.findMany({
    where: { cpf: { in: cpfsUnicos } },
    include: {
      parceiro: {
        include: {
          comercial: { include: { lideranca: true } },
          gestor: { include: { lideranca: true } },
        },
      },
    },
  });

  const indicadosPorCpf = new Map(indicados.map((i) => [i.cpf, i]));

  // PASSO 3: Coletar todos os usuarios (comerciais/gestores) únicos e buscar em batch
  const usuariosContaUnicos = Array.from(
    new Set(linhasValidas.filter((l) => l.usuarioDaConta).map((l) => l.usuarioDaConta)),
  );

  const comerciais = await prisma.comercial.findMany({
    where: {
      lideranca: { backofficeId },
      OR: usuariosContaUnicos.map((u) => ({ nome: { contains: u, mode: "insensitive" as const } })),
    },
    include: { lideranca: true },
  });

  const gestores = await prisma.gestor.findMany({
    where: {
      lideranca: { backofficeId },
      OR: usuariosContaUnicos.map((u) => ({ nome: { contains: u, mode: "insensitive" as const } })),
    },
    include: { lideranca: true },
  });

  // Mapear usuariosConta para comercial/gestor usando match de substring
  const comercialPorUsuario = new Map<string, string>();
  const gestorPorUsuario = new Map<string, string>();

  for (const usuario of usuariosContaUnicos) {
    const comercial = comerciais.find((c) =>
      c.nome.toLowerCase().includes(usuario.toLowerCase()),
    );
    if (comercial) {
      comercialPorUsuario.set(usuario, comercial.id);
    } else {
      const gestor = gestores.find((g) =>
        g.nome.toLowerCase().includes(usuario.toLowerCase()),
      );
      if (gestor) {
        gestorPorUsuario.set(usuario, gestor.id);
      }
    }
  }

  // PASSO 4: Construir procedimentos processados
  const procedimentos: any[] = [];
  let processedRows = 0;
  let orphanedRows = 0;
  let linhasComComercial = 0;
  let linhasSemComercial = 0;
  const vendasPorComercialMes: Record<string, Record<string, number>> = {};

  for (const linha of linhasValidas) {
    const indicado = indicadosPorCpf.get(linha.cpf);

    const isOrfao =
      !indicado ||
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

      if (linha.usuarioDaConta) {
        comercialId = comercialPorUsuario.get(linha.usuarioDaConta) ?? null;
        if (!comercialId) {
          gestorId = gestorPorUsuario.get(linha.usuarioDaConta) ?? null;
        }
      }
    }

    if (isOrfao) orphanedRows++;

    if (comercialId) {
      linhasComComercial++;
      if (!vendasPorComercialMes[comercialId]) {
        vendasPorComercialMes[comercialId] = {};
      }
      vendasPorComercialMes[comercialId][linha.dataRefStr] =
        (vendasPorComercialMes[comercialId][linha.dataRefStr] || 0) + linha.totalPago;
    } else {
      linhasSemComercial++;
    }

    procedimentos.push({
      dataReferencia: linha.dataRef,
      dataPagamento: linha.dataPag,
      formaPagamento: linha.formaPag,
      totalPago: Number(linha.totalPago),
      paciente: linha.paciente,
      procedimento: linha.procedimento,
      cpf: linha.cpf,
      tipoProcedimento: linha.tipoProc,
      unidade: linha.unidade,
      parceiroId,
      indicadoId,
      comercialId,
      gestorId,
      uploadId: upload.id,
    });

    processedRows++;
  }

  // PASSO 5: Inserir procedimentos em batch (dividindo em chunks)
  if (procedimentos.length > 0) {
    for (let i = 0; i < procedimentos.length; i += BATCH_SIZE) {
      const batch = procedimentos.slice(i, i + BATCH_SIZE);
      await prisma.procedimentoPF.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }

  // PASSO 6: Processar pontos em batch (já usa cache por parceiro)
  await processarPontosBatch(procedimentos, backofficeId);

  // PASSO 7: Processar comissões em batch (já agrega por comercial/mês)
  await processarComissoesBatch(vendasPorComercialMes, backofficeId);

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
      rejectedRows,
      orphanedRows,
      linhasComComercial,
      linhasSemComercial,
    },
  };
}

/**
 * Normaliza e valida uma linha sem fazer queries.
 * Retorna null se inválida.
 */
function normalizarLinha(row: any):
  | {
      dataRef: Date;
      dataPag: Date;
      formaPag: string;
      totalPago: number;
      paciente: string;
      procedimento: string;
      cpf: string;
      tipoProc: string;
      unidade: string;
      usuarioDaConta: string;
      dataRefStr: string;
    }
  | null {
  const dataRef = parseDate(row["Data de Referência"]);
  const dataPag = parseDate(row["Data do Pagamento"]);
  const formaPag = String(row["Forma de Pagamento"] || "").trim();
  const totalPago = parseNumber(row["Total Pago"]);
  const paciente = String(row["Paciente"] || "").trim();
  const procedimento = String(row["Procedimento"] || "").trim();

  const cpfRaw = String(row["CPF"] || "")
    .replace(/["']/g, "")
    .replace(/\D/g, "")
    .trim();
  const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, "0");

  const tipoProc = String(row["Tipo do Procedimento"] || "").trim();
  const unidade = String(row["Unidade"] || "").trim();
  const usuarioDaConta = String(row["Usuário da conta"] || "").trim();

  const todosVazios =
    (!dataRef || !dataPag) &&
    !formaPag &&
    !totalPago &&
    !paciente &&
    !procedimento &&
    !cpfRaw &&
    !tipoProc &&
    !unidade &&
    !usuarioDaConta;

  if (todosVazios) return null;

  if (!dataRef || !dataPag || !totalPago || !cpf || cpf.length !== 11 || cpf === "00000000000") {
    return null;
  }

  const tipoLower = tipoProc.toLowerCase();
  if (
    tipoLower.includes("cancelamento") ||
    tipoLower.includes("devolução") ||
    tipoLower.includes("estorno")
  ) {
    return null;
  }

  if (totalPago < 0) return null;

  return {
    dataRef,
    dataPag,
    formaPag,
    totalPago,
    paciente,
    procedimento,
    cpf,
    tipoProc,
    unidade,
    usuarioDaConta,
    dataRefStr: dataRef.toISOString().split("T")[0],
  };
}

/**
 * Processa pontos em batch - já cacheado por parceiro.
 */
async function processarPontosBatch(procedimentos: any[], backofficeId: string) {
  const parceiroIds = Array.from(
    new Set(procedimentos.filter((p) => p.parceiroId).map((p) => p.parceiroId)),
  );

  if (parceiroIds.length === 0) return;

  // PASSO 1: Buscar todos os parceiros em batch
  const parceiros = await prisma.parceiro.findMany({
    where: { id: { in: parceiroIds } },
    select: { id: true, periodicidadeCicloEscolhida: true },
  });

  const parceiroMap = new Map(parceiros.map((p) => [p.id, p]));

  // PASSO 2: Buscar todos os ciclos vigentes em batch
  const ciclosUnicos = await prisma.cicloPontos.findMany({
    where: { backofficeId, status: { in: ["EM_ANDAMENTO", "RESGATE_ABERTO"] } },
  });

  const cicloPorParceiro = new Map<string, { id: string }>();
  for (const p of parceiros) {
    const periodicidade = p.periodicidadeCicloEscolhida ?? "ANUAL";
    const ciclo = ciclosUnicos.find(
      (c) =>
        c.periodicidade === periodicidade &&
        (c.status === "EM_ANDAMENTO" || c.status === "RESGATE_ABERTO"),
    );
    if (ciclo) {
      cicloPorParceiro.set(p.id, { id: ciclo.id });
    }
  }

  // PASSO 3: Buscar configurações vigentes
  const configEntries = await prisma.configuracaoPontos.findMany({
    where: { backofficeId },
    orderBy: { vigenteDesde: "desc" },
  });

  const configPorCiclo = new Map<string, { id: string }>();
  for (const config of configEntries) {
    if (!configPorCiclo.has(config.id)) {
      configPorCiclo.set(config.id, { id: config.id });
    }
  }

  // PASSO 4: Calcular e preparar movimentações em batch
  const movimentacoes: any[] = [];

  for (const p of procedimentos) {
    if (!p.parceiroId) continue;

    const ciclo = cicloPorParceiro.get(p.parceiroId);
    if (!ciclo) continue;

    const configEntry = configPorCiclo.get(ciclo.id);
    if (!configEntry) continue;

    const pontos = await calcularPontosDeProducao(
      p.totalPago,
      p.tipoProcedimento,
      p.procedimento,
    );

    if (pontos > 0) {
      movimentacoes.push({
        cicloPontosId: ciclo.id,
        parceiroId: p.parceiroId,
        tipo: "CREDITO",
        origem: "PRODUCAO_IMPORTADA",
        quantidade: pontos,
        descricao: `Pontos por produção importada - ${p.procedimento}`,
      });
    }
  }

  // PASSO 5: Inserir movimentações em batch
  if (movimentacoes.length > 0) {
    for (let i = 0; i < movimentacoes.length; i += BATCH_SIZE) {
      const batch = movimentacoes.slice(i, i + BATCH_SIZE);
      await prisma.movimentacaoPontos.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }
}

/**
 * Processa comissões em batch - já agregado por comercial/mês.
 */
async function processarComissoesBatch(
  vendasPorComercialMes: Record<string, Record<string, number>>,
  backofficeId: string,
) {
  const promises = Object.entries(vendasPorComercialMes).flatMap(
    ([comercialId, vendasPorMes]) =>
      Object.entries(vendasPorMes).map(([mesRef, totalVendas]) => {
        const [ano, mes] = mesRef.split("-");
        return calcularComissaoComercial({
          comercialId,
          valorProcedimento: totalVendas,
          dataReferencia: new Date(Number(ano), Number(mes) - 1, 1),
        });
      }),
  );

  await Promise.allSettled(promises);
}
