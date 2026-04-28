import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { ALLOWED_MIMETYPES, MAX_UPLOAD_SIZE } from "@asa/shared";

// AVISO: gravação em disco é incompatível com Vercel serverless.
// Em produção, substitua por upload para storage externo (ex: S3, Vercel Blob).
const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function saveUploadedFile(
  file: File,
  subDir: string,
): Promise<{
  path: string;
  size: number;
  mimetype: string;
  originalName: string;
}> {
  if (
    !ALLOWED_MIMETYPES.includes(file.type as (typeof ALLOWED_MIMETYPES)[number])
  ) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      `Arquivo excede o tamanho máximo de ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
    );
  }

  const dirPath = join(UPLOAD_DIR, subDir);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}-${safeName}`;
  const filePath = join(dirPath, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return {
    path: `/uploads/${subDir}/${fileName}`,
    size: file.size,
    mimetype: file.type,
    originalName: file.name,
  };
}
