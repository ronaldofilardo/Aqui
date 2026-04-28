import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { requireConsultor, forbidden, notFound } from "@/lib/api-helpers";
import { generateInviteToken } from "@/lib/invite-token";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const { id } = await params;

  const estab = await prisma.estabelecimento.findUnique({
    where: { id },
    select: { id: true, consultorId: true, nomeFantasia: true },
  });

  if (!estab) return notFound("Estabelecimento não encontrado");
  if (estab.consultorId !== session!.user.consultorId) return forbidden();

  const token = generateInviteToken(id);
  const baseUrl =
    process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  return NextResponse.json({
    link: `${baseUrl}/acesso/${token}`,
    expiresEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
