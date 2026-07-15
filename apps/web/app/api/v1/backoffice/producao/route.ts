import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, created, requireBackofficeWithScope } from "@/lib/api-helpers";
import { processarUploadPlanilhaPF } from "@/lib/processar-upload-pf";

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
