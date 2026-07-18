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

      // Soft delete: inativar usuario (nao deletar)
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: "INATIVO" },
      });

      // Se solicitado, inativar estabelecimentos tambem
      if (deleteEstabelecimentos) {
        await prisma.estabelecimento.updateMany({
          where: { consultorId: params.id },
          data: { status: "INATIVO" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Consultor inativado com sucesso (dados preservados)",
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

      // Soft delete: inativar ao invés de deletar
      await prisma.usuarioEstabelecimento.update({
        where: { id: params.id },
        data: { ativo: false },
      });

      return NextResponse.json({
        success: true,
        message: "Usuário estabelecimento inativado com sucesso",
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting usuario:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar solicitação",
      },
      { status: 500 },
    );
  }
}
