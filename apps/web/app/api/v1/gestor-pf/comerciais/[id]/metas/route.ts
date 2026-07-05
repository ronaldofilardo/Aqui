import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  notFound,
  ok,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { upsertMetaComercialSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id, gestorPfId },
    select: { id: true },
  });
  if (!comercial) return notFound("Comercial não encontrado");

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
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = upsertMetaComercialSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id, gestorPfId },
    select: { id: true },
  });
  if (!comercial) return notFound("Comercial não encontrado");

  const valorMetaNum =
    typeof parsed.data.valorMeta === "string"
      ? parseFloat(parsed.data.valorMeta)
      : parsed.data.valorMeta;

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
      valorMeta: valorMetaNum,
      valorAtingido: 0,
    },
    update: {
      valorMeta: valorMetaNum,
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
    },
  });

  return ok(meta);
}
