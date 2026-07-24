import { NextRequest } from "next/server";
import { prisma } from "@aqui/database";
import { requireConsultor, created, badRequest, notFound, forbidden } from "@/lib/api-helpers";
import { saveUploadedFile } from "@/lib/upload";
import { ALLOWED_MIMETYPES, MAX_UPLOAD_SIZE } from "@aqui/shared";
import { criarAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const { id } = await params;
  const estab = await prisma.estabelecimento.findUnique({ where: { id } });
  if (!estab) return notFound("Estabelecimento não encontrado");
  if (estab.consultorId !== session!.user.consultorId) return forbidden();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tipo = formData.get("tipo") as string | null;

  if (!file) return badRequest("Arquivo é obrigatório");
  if (!tipo || !["CNPJ", "CPF_RESPONSAVEL"].includes(tipo)) {
    return badRequest("Tipo deve ser CNPJ ou CPF_RESPONSAVEL");
  }
  if (!ALLOWED_MIMETYPES.includes(file.type)) {
    return badRequest("Tipo de arquivo não permitido. Use PDF, JPG ou PNG");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return badRequest("Arquivo excede o tamanho máximo de 5MB");
  }

  const savedFile = await saveUploadedFile(file, id);

  const documento = await prisma.documento.create({
    data: {
      estabelecimentoId: id,
      tipo: tipo as "CNPJ" | "CPF_RESPONSAVEL",
      urlArquivo: savedFile.path,
      nomeOriginal: savedFile.originalName,
      tamanhoBytes: savedFile.size,
      mimetype: savedFile.mimetype,
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "UPLOAD_DOCUMENTO",
    entidade: "documento",
    entidadeId: documento.id,
    detalhes: { tipo, nomeOriginal: savedFile.originalName },
  });

  return created(documento);
}
