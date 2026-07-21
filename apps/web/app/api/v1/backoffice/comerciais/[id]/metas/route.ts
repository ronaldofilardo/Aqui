import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { upsertMetaComercialSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  // Buscar comercial e verificar se pertence a uma liderança deste backoffice
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  // Verificar permissão: se tiver liderança, verificar se pertence a este backoffice
  // Se não tiver liderança, permitir (comercial criado diretamente neste backoffice)
  if (comercial.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  const metas = await prisma.metaComercial.findMany({
    where: { comercialId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(metas);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = upsertMetaComercialSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  // Buscar comercial e verificar permissão
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  // Verificar permissão: se tiver liderança, verificar se pertence a este backoffice
  // Se não tiver liderança, permitir (comercial criado diretamente neste backoffice)
  if (comercial.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  const valorMetaNum =
    parsed.data.valorMeta !== undefined
      ? typeof parsed.data.valorMeta === "string"
        ? parseFloat(parsed.data.valorMeta)
        : parsed.data.valorMeta
      : undefined;

  const valorAtingidoNum =
    parsed.data.valorAtingido !== undefined
      ? typeof parsed.data.valorAtingido === "string"
        ? parseFloat(parsed.data.valorAtingido)
        : parsed.data.valorAtingido
      : undefined;

  const meta = await prisma.metaComercial.upsert({
    where: {
      comercialId_mesReferencia: {
        comercialId: params.id,
        mesReferencia: parsed.data.mesReferencia,
      },
    },
    create: {
      comercialId: params.id,
      mesReferencia: parsed.data.mesReferencia,
      valorMeta: valorMetaNum ?? 0,
      valorAtingido: valorAtingidoNum ?? 0,
    },
    update: {
      ...(valorMetaNum !== undefined ? { valorMeta: valorMetaNum } : {}),
      ...(valorAtingidoNum !== undefined ? { valorAtingido: valorAtingidoNum } : {}),
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "UPSERT_META_COMERCIAL",
    entidade: "meta_comercial",
    entidadeId: meta.id,
    detalhes: {
      comercialId: params.id,
      mesReferencia: parsed.data.mesReferencia,
      valorMeta: valorMetaNum,
      valorAtingido: valorAtingidoNum,
    },
  });

  return ok(meta);
}

