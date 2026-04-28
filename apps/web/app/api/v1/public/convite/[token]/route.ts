import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { validateInviteToken } from "@/lib/invite-token";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const validated = validateInviteToken(token);
  if (!validated) {
    return NextResponse.json(
      { error: "Link inválido ou expirado" },
      { status: 410 },
    );
  }

  const estab = await prisma.estabelecimento.findUnique({
    where: { id: validated.estabelecimentoId },
    select: {
      id: true,
      nomeFantasia: true,
      _count: { select: { usuarios: true } },
    },
  });

  if (!estab) {
    return NextResponse.json(
      { error: "Estabelecimento não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    estabelecimentoId: estab.id,
    nomeFantasia: estab.nomeFantasia,
    jaTemAcesso: estab._count.usuarios > 0,
  });
}
