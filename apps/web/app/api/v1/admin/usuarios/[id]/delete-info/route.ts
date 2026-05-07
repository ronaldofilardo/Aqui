import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "CONSULTOR") {
      // Check comissões linked to this consultor
      const comissoes = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: {
          usuario: {
            select: {
              cupomConfig: {
                select: { id: true },
              },
            },
          },
        },
      });

      const cupomConfigCount = comissoes?.usuario?.cupomConfig?.length || 0;

      // Check estabelecimentos
      const estabelecimentos = await prisma.estabelecimento.findMany({
        where: { consultorId: params.id },
        select: { id: true },
      });

      return NextResponse.json({
        comissoesCount: cupomConfigCount,
        estabelecimentosCount: estabelecimentos.length,
      });
    } else if (type === "ESTABELECIMENTO") {
      // Check usuarios in this estabelecimento
      const usuarios = await prisma.usuarioEstabelecimento.findMany({
        where: { estabelecimentoId: params.id },
        select: { id: true },
      });

      return NextResponse.json({
        usuariosEstabelecimentoCount: usuarios.length,
        comissoesCount: 0,
        estabelecimentosCount: 0,
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching delete info:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao buscar informações",
      },
      { status: 500 },
    );
  }
}
