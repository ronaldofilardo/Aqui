import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@asa/database";
import { badRequest, created, ok, notFound, requireGestorPFWithScope } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { processUploadPlanilha } from "./service";

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

    if (!upload) return notFound("Upload não encontrado");
    return ok(upload);
  }

  const uploads = await prisma.uploadPlanilhaPF.findMany({
    where: { gestorPfId },
    include: {
      procedimentos: {
        select: { id: true, paciente: true, procedimento: true, totalPago: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { procedimentos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(uploads);
}

export async function POST(req: NextRequest) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) return badRequest("Nenhum arquivo enviado");
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return badRequest("Apenas arquivos Excel (.xlsx, .xls) são permitidos");
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const result = await processUploadPlanilha(gestorPfId, worksheet, file.name);

    await criarAuditLog({
      usuarioId: gestorPfId,
      acao: "UPLOAD_PLANILHA_PONTOS",
      entidade: "UploadPlanilhaPF",
      entidadeId: result.upload.id,
      detalhes: {
        arquivo: file.name,
        ...result.summary,
      },
    });

    return created({
      mensagem: "Planilha processada com sucesso",
      upload: result.upload,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return badRequest(error.message || "Erro ao processar planilha");
  }
}