import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, created, requireBackofficeWithScope } from "@/lib/api-helpers";
import { parsePlanilhaProducao } from "@/lib/parse-planilha-producao";

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return badRequest("Arquivo é obrigatório");
    }

    // Validar formato do arquivo
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      return badRequest("Apenas arquivos Excel (.xlsx ou .xls) são permitidos");
    }

    // Parse da planilha
    const resultado = await parsePlanilhaProducao(file, backofficeId);

    return created(resultado);
  } catch (e: any) {
    console.error("[preview POST] Erro:", e);
    return badRequest("Erro ao processar planilha: " + e.message);
  }
}