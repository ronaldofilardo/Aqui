import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  requireConsultor,
  ok,
  notFound,
  forbidden,
} from "@/lib/api-helpers";
import QRCode from "qrcode";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const { id } = await params;

  const estab = await prisma.estabelecimento.findUnique({
    where: { id },
    include: { cupomConfig: true },
  });

  if (!estab) return notFound("Estabelecimento não encontrado");
  if (estab.consultorId !== session!.user.consultorId) return forbidden();
  if (!estab.cupomConfig)
    return notFound("Estabelecimento não possui cupom configurado");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cupomUrl = `${baseUrl}/cupom/${estab.cupomConfig.codigoCupom}`;

  const qrDataUrl = await QRCode.toDataURL(cupomUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#1e40af", light: "#ffffff" },
  });

  return ok({
    qrCode: qrDataUrl,
    url: cupomUrl,
    codigoCupom: estab.cupomConfig.codigoCupom,
    estabelecimento: estab.nomeFantasia,
  });
}
