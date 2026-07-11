import { prisma } from "@asa/database";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "uploads", "gestor-pf");

/**
 * Processa upload de planilha PF em background
 * Esta função deve ser substituída por uma implementação real de processamento
 */
export async function processarUploadPlanilhaPF(
  uploadId: string,
  file: File
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

    // Atualizar status para processado (placeholder)
    await prisma.uploadPlanilhaPF.update({
      where: { id: uploadId },
      data: {
        status: "PROCESSADO",
        totalRows: 0,
        processedRows: 0,
        rejectedRows: 0,
        orphanedRows: 0,
      },
    });

    console.log(`[processarUploadPlanilhaPF] Arquivo salvo: ${fileName}`);
  } catch (error) {
    console.error("[processarUploadPlanilhaPF] Erro:", error);
    await prisma.uploadPlanilhaPF.update({
      where: { id: uploadId },
      data: { status: "ERRO" },
    });
    throw error;
  }
}