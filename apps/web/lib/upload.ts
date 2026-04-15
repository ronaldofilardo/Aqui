import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function saveUploadedFile(
  file: File,
  subDir: string
): Promise<{ path: string; size: number; mimetype: string; originalName: string }> {
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
