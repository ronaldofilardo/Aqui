import { NextResponse } from "next/server";
import { requireGestor } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // Validate gestor access
    await requireGestor();

    // Fetch all consultores with their usuarios
    const consultores = await prisma.consultor.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
            status: true,
          },
        },
      },
    });

    // Fetch all usuarioEstabelecimentos with their estabelecimentos
    const usuariosEstabelecimento =
      await prisma.usuarioEstabelecimento.findMany({
        include: {
          estabelecimento: {
            select: {
              nomeFantasia: true,
            },
          },
        },
      });

    // Format consultores
    const consultoresFormatted = consultores.map((consultor) => ({
      id: consultor.id,
      usuarioId: consultor.usuarioId,
      nome: consultor.usuario.nome,
      email: consultor.usuario.email,
      cpf: consultor.cpf,
      tipo: "CONSULTOR" as const,
      status: consultor.usuario.status,
      hierarquia: "CONSULTOR" as const,
    }));

    // Format usuarioEstabelecimento
    const usuariosEstabelecimentoFormatted = usuariosEstabelecimento.map(
      (usuario) => ({
        id: usuario.id,
        usuarioEstabelecimentoId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: null,
        tipo: "ESTABELECIMENTO" as const,
        tipoAcesso: usuario.tipo,
        status: usuario.ativo ? ("ATIVO" as const) : ("INATIVO" as const),
        hierarquia: "ESTABELECIMENTO" as const,
        estabelecimento: usuario.estabelecimento.nomeFantasia,
      }),
    );

    // Combine and sort by nome
    const usuarios = [
      ...consultoresFormatted,
      ...usuariosEstabelecimentoFormatted,
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json({
      success: true,
      usuarios,
      total: usuarios.length,
    });
  } catch (error) {
    console.error("Error fetching usuarios:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao listar usuários",
      },
      {
        status:
          error instanceof Error && error.message.includes("Unauthorized")
            ? 401
            : 500,
      },
    );
  }
}
