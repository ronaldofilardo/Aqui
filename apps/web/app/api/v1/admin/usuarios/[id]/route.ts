import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const body = await request.json();
    const { deleteEstabelecimentos } = body;

    if (type === "CONSULTOR") {
      const consultor = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: { usuarioId: true, id: true },
      });

      if (!consultor) {
        return NextResponse.json(
          { error: "Consultor não encontrado" },
          { status: 404 },
        );
      }

      const usuarioId = consultor.usuarioId;

      const estabelecimentoIds: string[] = [];
      if (deleteEstabelecimentos) {
        const estabs = await prisma.estabelecimento.findMany({
          where: { consultorId: params.id },
          select: { id: true },
        });
        estabelecimentoIds.push(...estabs.map((e) => e.id));
      }

      if (usuarioId) {
        const cuponsConfig = await prisma.cupomConfig.findMany({
          where: { criadoPor: usuarioId },
          select: { id: true },
        });
        const cupomConfigIds = cuponsConfig.map((cc) => cc.id);

        if (cupomConfigIds.length > 0) {
          const cuponsImportados = await prisma.cupomImportado.findMany({
            where: { cupomConfigId: { in: cupomConfigIds } },
            select: { id: true },
          });
          const cupomImportadoIds = cuponsImportados.map((ci) => ci.id);

          if (cupomImportadoIds.length > 0) {
            await prisma.consulta.deleteMany({
              where: { cupomImportadoId: { in: cupomImportadoIds } },
            });
          }

          await prisma.cupomImportado.deleteMany({
            where: { cupomConfigId: { in: cupomConfigIds } },
          });
        }

        await prisma.cupomConfig.deleteMany({
          where: { criadoPor: usuarioId },
        });
      }

      if (estabelecimentoIds.length > 0) {
        const allCupomImportados = await prisma.cupomImportado.findMany({
          where: {
            cupomConfig: { estabelecimentoId: { in: estabelecimentoIds } },
          },
          select: { id: true },
        });
        const allCupomImportadoIds = allCupomImportados.map((ci) => ci.id);

        if (allCupomImportadoIds.length > 0) {
          await prisma.consulta.deleteMany({
            where: { cupomImportadoId: { in: allCupomImportadoIds } },
          });
        }

        await prisma.usuarioEstabelecimento.deleteMany({
          where: { estabelecimentoId: { in: estabelecimentoIds } },
        });

        await prisma.documento.deleteMany({
          where: { estabelecimentoId: { in: estabelecimentoIds } },
        });

        await prisma.estabelecimento.deleteMany({
          where: { id: { in: estabelecimentoIds } },
        });
      }

      await prisma.consultor.delete({
        where: { id: params.id },
      });

      await prisma.usuario.delete({
        where: { id: usuarioId },
      });

      return NextResponse.json({
        success: true,
        message: "Consultor deletado com sucesso",
      });
    } else if (type === "ESTABELECIMENTO") {
      const usuario = await prisma.usuarioEstabelecimento.findUnique({
        where: { id: params.id },
        select: { id: true },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "Usuário estabelecimento não encontrado" },
          { status: 404 },
        );
      }

      await prisma.usuarioEstabelecimento.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        success: true,
        message: "Usuário deletado com sucesso",
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting usuario:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao deletar usuário",
      },
      { status: 500 },
    );
  }
}