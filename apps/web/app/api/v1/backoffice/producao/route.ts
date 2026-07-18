import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, created, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import { processarUploadPlanilhaPF } from "@/lib/processar-upload-pf";

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mesReferencia = searchParams.get("mesReferencia");
  const parceiroId = searchParams.get("parceiroId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  // Buscar IDs dos parceiros deste backoffice via Lideranca -> Comercial/Gestor -> Parceiro
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    select: { id: true },
  });
  const liderancaIds = liderancas.map((l) => l.id);

  const [comerciais, gestores] = await Promise.all([
    prisma.comercial.findMany({
      where: { liderancaId: { in: liderancaIds } },
      select: { id: true },
    }),
    prisma.gestor.findMany({
      where: { liderancaId: { in: liderancaIds } },
      select: { id: true },
    }),
  ]);

  const comercialIds = comerciais.map((c) => c.id);
  const gestorIds = gestores.map((g) => g.id);

  const parceirosDoBackoffice = await prisma.parceiro.findMany({
    where: {
      OR: [
        { comercialId: { in: comercialIds } },
        { gestorId: { in: gestorIds } },
      ],
    },
    select: { id: true },
  });
  const parceiroIds = parceirosDoBackoffice.map((p) => p.id);

  const where: Record<string, unknown> = {};

  if (parceiroIds.length > 0) {
    where.parceiroId = parceiroId
      ? parceiroId
      : { in: parceiroIds };
  } else if (parceiroId) {
    where.parceiroId = parceiroId;
  }

  if (status && status !== "TODOS") {
    where.statusComissao = status;
  }

  if (mesReferencia) {
    const [ano, mes] = mesReferencia.split("-");
    const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
    const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
    where.dataReferencia = { gte: inicioMes, lte: fimMes };
  }

  const [procedimentos, total, parceiros, mesesDisponiveis] = await Promise.all([
    prisma.procedimentoPF.findMany({
      where,
      include: {
        parceiro: { select: { id: true, nome: true, cpf: true } },
        indicado: { select: { id: true, nome: true, cpf: true } },
        comercial: { select: { id: true, nome: true, funcao: true } },
        upload: { select: { id: true, nomeArquivo: true, mesReferencia: true } },
      },
      orderBy: { dataReferencia: "desc" },
      take: limit,
      skip,
    }),
    prisma.procedimentoPF.count({ where }),
    prisma.parceiro.findMany({
      where: parceiroIds.length > 0 ? { id: { in: parceiroIds } } : undefined,
      select: { id: true, nome: true, cpf: true },
      orderBy: { nome: "asc" },
    }),
    prisma.procedimentoPF.findMany({
      where: parceiroIds.length > 0 ? { parceiroId: { in: parceiroIds } } : undefined,
      select: { dataReferencia: true },
      distinct: ["dataReferencia"],
      orderBy: { dataReferencia: "desc" },
    }),
  ]);

  const mesesSet = new Set<string>();
  for (const p of mesesDisponiveis) {
    const d = new Date(p.dataReferencia);
    mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return ok({
    procedimentos,
    parceiros,
    mesesDisponiveis: Array.from(mesesSet),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mesReferencia = formData.get("mesReferencia") as string;

    if (!file || !mesReferencia) {
      return badRequest("Arquivo e mês de referência são obrigatórios");
    }

    // Validar formato do arquivo
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      return badRequest("Apenas arquivos Excel (.xlsx ou .xls) são permitidos");
    }

    // Criar registro de upload
    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: file.name,
        mesReferencia,
        status: "PROCESSANDO",
        totalRows: 0,
        processedRows: 0,
        rejectedRows: 0,
        orphanedRows: 0,
      },
    });

    // Processar planilha em background
    processarUploadPlanilhaPF(upload.id, file).catch((err) => {
      console.error("[processarUploadPlanilhaPF] Erro:", err);
    });

    return created({
      id: upload.id,
      nomeArquivo: file.name,
      mesReferencia,
      status: upload.status,
    });
  } catch (e: any) {
    console.error("[upload POST] Erro:", e);
    return badRequest("Erro ao fazer upload: " + e.message);
  }
}
