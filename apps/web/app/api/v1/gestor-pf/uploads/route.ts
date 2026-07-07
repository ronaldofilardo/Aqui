import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  created,
  ok,
  notFound,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import {
  calcularPontosDeProducao,
  obterCicloVigente,
  calcularComissaoComercial,
} from "@/lib/pontos-utils";
import * as XLSX from "xlsx";

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

interface RowData {
  "Data de Referência"?: string | number | Date;
  "Data do Pagamento"?: string | number | Date;
  "Forma de Pagamento"?: string;
  "Total Pago"?: string | number;
  "Paciente"?: string;
  "Procedimento"?: string;
  "CPF"?: string;
  "Tipo do Procedimento"?: string;
  "Unidade"?: string;
  "Usuário da conta"?: string;
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
  
  // Se for string, limpar e converter
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

export async function GET(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const upload = await prisma.uploadPlanilhaPF.findFirst({
      where: { id, gestorPfId },
      include: {
        procedimentos: {
          include: {
            indicado: { select: { id: true, nome: true, cpf: true } },
            parceiro: { select: { id: true, nome: true } },
            comercial: { select: { id: true, nome: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    if (!upload) {
      return notFound("Upload não encontrado");
    }

    return ok(upload);
  }

  const uploads = await prisma.uploadPlanilhaPF.findMany({
    where: { gestorPfId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      nomeArquivo: true,
      mesReferencia: true,
      status: true,
      totalRows: true,
      processedRows: true,
      rejectedRows: true,
      orphanedRows: true,
      createdAt: true,
      _count: { select: { procedimentos: true } },
    },
  });

  return ok(uploads);
}

export async function POST(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mesReferencia = formData.get("mesReferencia") as string;

    if (!file) {
      return badRequest("Arquivo é obrigatório");
    }

    if (!mesReferencia || !/^\d{4}-\d{2}$/.test(mesReferencia)) {
      return badRequest("Mês de referência é obrigatório (formato: YYYY-MM)");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Ler como array de arrays para identificar o cabeçalho corretamente
    const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      range: 0 // Ler todas as linhas desde o início
    });
    
    // Verificar se a primeira linha é um título (não contém as colunas esperadas)
    let startRow = 0;
    const firstRow = allRows[0] as string[];
    if (!firstRow.some(cell => String(cell).includes("Data de Referência"))) {
      startRow = 1; // Pular título
    }
    
    // Ler dados como objeto a partir da linha do cabeçalho
    const rawData: RowData[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      range: startRow
    });

    const upload = await prisma.uploadPlanilhaPF.create({
      data: {
        gestorPfId,
        nomeArquivo: file.name,
        mesReferencia,
        status: "PROCESSANDO",
        totalRows: rawData.length,
      },
    });

    let processedRows = 0;
    let rejectedRows = 0;
    let orphanedRows = 0;
    let linhasComComercial = 0;
    let linhasSemComercial = 0;

    const cpfsProcessados = new Set<string>();

    const procedimentos: {
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
      uploadId: string;
    }[] = [];

    // Para idempotência: re-agrupar por (parceiroId, comercialId) para totalizar
    // a partir dos procedimentos já persistidos no banco após o createMany.
    // Mapa: comercialId -> mesReferencia -> totalPago
    const vendasPorComercialMes: Record<
      string,
      Record<string, number>
    > = {};

    for (const row of rawData) {
      const dataRef = parseDate(row["Data de Referência"]);
      const dataPag = parseDate(row["Data do Pagamento"]);
      const formaPag = String(row["Forma de Pagamento"] || "").trim();
      const totalPago = parseNumber(row["Total Pago"]);
      const paciente = String(row["Paciente"] || "").trim();
      const procedimento = String(row["Procedimento"] || "").trim();
      
      // Limpar CPF de forma mais robusta - remover aspas, pontos, traços e espaços
      const cpfRaw = String(row["CPF"] || "")
        .replace(/["']/g, "")  // Remove aspas duplas e simples
        .replace(/\D/g, "")    // Remove tudo que não é dígito
        .trim();
      const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, "0");
      
      const tipoProc = String(row["Tipo do Procedimento"] || "").trim();
      const unidade = String(row["Unidade"] || "").trim();
      
      const usuarioDaConta = String(row["Usuário da conta"] || "").trim();

      // Pular linhas completamente vazias (apenas espaços em branco na planilha)
      const todosVazios = 
        (!dataRef || !dataPag) &&
        (!formaPag || formaPag === "") &&
        (!totalPago || totalPago === 0) &&
        (!paciente || paciente === "") &&
        (!procedimento || procedimento === "") &&
        (!cpfRaw || cpfRaw === "") &&
        (!tipoProc || tipoProc === "") &&
        (!unidade || unidade === "") &&
        (!usuarioDaConta || usuarioDaConta === "");
      
      if (todosVazios) {
        continue;
      }

      if (!dataRef || !dataPag || !totalPago || !cpf || cpf.length !== 11 || cpf === "00000000000") {
        rejectedRows++;
        continue;
      }

      const tipoLower = tipoProc.toLowerCase();
      if (
        tipoLower.includes("cancelamento") ||
        tipoLower.includes("devolução") ||
        tipoLower.includes("estorno")
      ) {
        rejectedRows++;
        continue;
      }

      if (totalPago < 0) {
        rejectedRows++;
        continue;
      }

      const dataRefStr = dataRef.toISOString().split("T")[0];
      // Verificar duplicidade - mesma data, CPF e procedimento
      const uniqueKey = `${dataRefStr}|${cpf}|${procedimento}`;

      if (cpfsProcessados.has(uniqueKey)) {
        rejectedRows++;
        continue;
      }
      cpfsProcessados.add(uniqueKey);

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
        indicado.parceiro.status === "DESLIGADO" ||
        indicado.parceiro.gestorPfId !== gestorPfId;

      // Identificação do Comercial via "Usuário da conta" (nome do comercial)
      let comercialId: string | null = null;
      let parceiroId: string | null = null;
      let indicadoId: string | null = null;
      
      if (!isOrfao && indicado?.parceiro) {
        parceiroId = indicado.parceiro.id;
        indicadoId = indicado.id;
        
        if (usuarioDaConta) {
          const comercial = await prisma.comercial.findFirst({
            where: {
              gestorPfId,
              nome: {
                contains: usuarioDaConta,
                mode: "insensitive",
              },
            },
            select: { id: true, nome: true, cpf: true },
          });
          comercialId = comercial?.id ?? null;
        }
      } else {
        // É órfão - ainda assim importa, mas sem vínculo com parceiro
        orphanedRows++;
      }

      if (comercialId) {
        linhasComComercial++;
        // Calcular mês de referência baseado na data do procedimento, não no upload
        const mesRefProcedimento = `${dataRef.getFullYear()}-${String(dataRef.getMonth() + 1).padStart(2, "0")}`;
        if (!vendasPorComercialMes[comercialId]) {
          vendasPorComercialMes[comercialId] = {};
        }
        vendasPorComercialMes[comercialId][mesRefProcedimento] =
          (vendasPorComercialMes[comercialId][mesRefProcedimento] || 0) +
          Number(totalPago);
      } else {
        linhasSemComercial++;
      }

      procedimentos.push({
        dataReferencia: dataRef,
        dataPagamento: dataPag,
        formaPagamento: formaPag,
        totalPago: Number(totalPago),
        paciente,
        procedimento,
        cpf,
        tipoProcedimento: tipoProc,
        unidade,
        parceiroId,
        indicadoId,
        comercialId,
        uploadId: upload.id,
      });

      processedRows++;
    }

    if (procedimentos.length > 0) {
      await prisma.procedimentoPF.createMany({
        data: procedimentos,
        skipDuplicates: true,
      });

      // Pontos: gerar MovimentacaoPontos por parceiro/procedimento respeitando
      // a periodicidade escolhida pelo parceiro (default: ANUAL).
      // Cache de ciclo por (parceiroId) para evitar buscar repetidamente.
      const cicloCache = new Map<
        string,
        { id: string } | null
      >();
      const configCache = new Map<
        string,
        { id: string; configuracaoPontosId: string } | null
      >();

      for (const p of procedimentos) {
        if (!p.parceiroId) continue;

        let ciclo = cicloCache.get(p.parceiroId);
        if (ciclo === undefined) {
          const parceiro = await prisma.parceiro.findUnique({
            where: { id: p.parceiroId },
            select: { periodicidadeCicloEscolhida: true },
          });
          const periodicidade =
            parceiro?.periodicidadeCicloEscolhida ?? "ANUAL";
          const cicloVigente = await obterCicloVigente(
            gestorPfId!,
            periodicidade,
          );
          ciclo = cicloVigente ? { id: cicloVigente.id } : null;
          cicloCache.set(p.parceiroId, ciclo);
        }

        if (!ciclo) continue; // Sem ciclo vigente para esta periodicidade

        let configEntry = configCache.get(ciclo.id);
        if (configEntry === undefined) {
          const config = await prisma.configuracaoPontos.findFirst({
            where: {
              gestorPfId,
              vigenteDesde: { lte: p.dataReferencia },
              OR: [
                { vigenteAte: null },
                { vigenteAte: { gte: p.dataReferencia } },
              ],
            },
            orderBy: { vigenteDesde: "desc" },
            select: { id: true },
          });
          configEntry = config ? { id: config.id, configuracaoPontosId: config.id } : null;
          configCache.set(ciclo.id, configEntry);
        }

        if (!configEntry) continue;

        // O procedimento foi recém-criado (skipDuplicates=true não dá o id),
        // então recuperamos o procedimento real pelo unique key.
        const procedimentoReal = await prisma.procedimentoPF.findFirst({
          where: {
            dataReferencia: p.dataReferencia,
            cpf: p.cpf,
            procedimento: p.procedimento,
            unidade: p.unidade,
            uploadId: upload.id,
          },
          select: { id: true },
        });
        if (!procedimentoReal) continue;

        try {
          const pontos = await calcularPontosDeProducao(
            p.totalPago,
            p.dataReferencia,
            gestorPfId!,
          );
          if (pontos > 0) {
            await prisma.movimentacaoPontos.create({
              data: {
                parceiroId: p.parceiroId,
                cicloPontosId: ciclo.id,
                tipo: "CREDITO",
                origem: "PRODUCAO_IMPORTADA",
                quantidade: pontos,
                referenciaProcedimentoId: procedimentoReal.id,
                configuracaoPontosId: configEntry.configuracaoPontosId,
                criadoPor: session!.user.id,
              },
            });
          }
        } catch (err) {
          console.error(
            "[upload-pf] Falha ao calcular/creditar pontos:",
            err,
          );
          // Continua o processamento mesmo se a config de pontos não estiver vigente
        }
      }

      // Recalcular vendas e comissões de comerciais (idempotente):
      // Somamos TODAS as linhas do mês para cada comercial, independente deste upload.
      // Fazemos isso fazendo um aggregate na tabela procedimentos_pf para todos os
      // comerciais impactados neste upload.
      const comercialIds = Object.keys(vendasPorComercialMes);
      if (comercialIds.length > 0) {
        // Buscar comerciais (incluindo funcao)
        const comerciaisRaw = await prisma.comercial.findMany({
          where: { id: { in: comercialIds } },
          select: {
            id: true,
            funcao: true,
            gestorPfId: true,
          },
        });
        const comercialMap = new Map(comerciaisRaw.map((c) => [c.id, c]));

        for (const comercialId of comercialIds) {
          for (const [mes, somaUpload] of Object.entries(
            vendasPorComercialMes[comercialId],
          )) {
            // Soma total do mês (idempotência):
            const totalCreditos = await prisma.procedimentoPF.aggregate({
              _sum: { totalPago: true },
              where: {
                comercialId,
                dataReferencia: {
                  gte: new Date(`${mes}-01`),
                  lt: new Date(
                    new Date(`${mes}-01`).getTime() + 35 * 24 * 60 * 60 * 1000,
                  ),
                },
              },
            });
            const valorVendas = Number(
              totalCreditos._sum.totalPago?.toString() || "0",
            );

            // Calcular comissão usando as novas regras
            const { valorComissao } = await calcularComissaoComercial({
              comercialId,
              valorProcedimento: valorVendas,
              dataReferencia: new Date(`${mes}-01`),
            });

            // Atualizar procedimentos com o valor de comissão (proporcional)
            const procedimentosDoComercial = await prisma.procedimentoPF.findMany({
              where: {
                comercialId,
                dataReferencia: {
                  gte: new Date(`${mes}-01`),
                  lt: new Date(
                    new Date(`${mes}-01`).getTime() + 35 * 24 * 60 * 60 * 1000,
                  ),
                },
              },
              select: { id: true, totalPago: true },
            });

            // Calcular comissão proporcional para cada procedimento
            for (const proc of procedimentosDoComercial) {
              const percentual = Number(proc.totalPago) / valorVendas;
              const comissaoProporcional = Number(valorComissao) * percentual;
              
              await prisma.procedimentoPF.update({
                where: { id: proc.id },
                data: {
                  valorComissao: comissaoProporcional,
                  statusComissao: "CALCULADA",
                },
              });
            }

            await prisma.comissaoComercial.upsert({
                where: {
                  comercialId_mesReferencia: {
                    comercialId,
                    mesReferencia: mes,
                  },
                },
                create: {
                  comercialId,
                  mesReferencia: mes,
                  valorVendas,
                  valorComissao,
                  status: "CALCULADA",
                },
              update: {
                valorVendas,
                valorComissao,
                status: "CALCULADA",
              },
            });

            // Atualizar meta atingida (se houver meta para o mês)
            await prisma.metaComercial.upsert({
              where: {
                comercialId_mesReferencia: {
                  comercialId,
                  mesReferencia: mes,
                },
              },
              create: {
                comercialId,
                mesReferencia: mes,
                valorMeta: 0,
                valorAtingido: valorVendas,
              },
              update: {
                valorAtingido: valorVendas,
              },
            });
          }
        }
      }
    }

    await prisma.uploadPlanilhaPF.update({
      where: { id: upload.id },
      data: {
        status: "CONCLUIDO",
        processedRows,
        rejectedRows,
        orphanedRows,
      },
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "UPLOAD_PLANILHA_PF",
      entidade: "upload_planilha_pf",
      entidadeId: upload.id,
      detalhes: {
        nomeArquivo: file.name,
        mesReferencia,
        totalRows: rawData.length,
        processedRows,
        rejectedRows,
        orphanedRows,
        linhasComComercial,
        linhasSemComercial,
      },
    });

    return created({
      id: upload.id,
      nomeArquivo: file.name,
      mesReferencia,
      status: "CONCLUIDO",
      totalRows: rawData.length,
      processedRows,
      rejectedRows,
      orphanedRows,
      linhasComComercial,
      linhasSemComercial,
    });
  } catch (error) {
    console.error("[upload-pf] Erro ao processar arquivo:", error);

    return badRequest("Erro ao processar arquivo");
  }
}
