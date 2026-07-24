import { NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/api-helpers";
import { prisma } from "@aqui/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const currentUserId = session?.user?.id;

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

    const gestores = await prisma.usuario.findMany({
      where: {
        tipo: "GESTOR_PJ",
        id: { not: currentUserId },
      },
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
        criadoEm: true,
        gestoresConsultores: {
          select: { id: true, consultorId: true },
        },
      },
    });

    const gestoresFormatted = gestores.map((gestor) => ({
      id: gestor.id,
      usuarioId: gestor.id,
      nome: gestor.nome,
      email: gestor.email,
      cpf: null,
      tipo: "GESTOR_PJ" as const,
      status: gestor.status,
      hierarquia: "GESTOR" as const,
      consultoresAtribuidos: gestor.gestoresConsultores.length,
    }));

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

    const usuarios = [
      ...gestoresFormatted,
      ...consultoresFormatted,
      ...usuariosEstabelecimentoFormatted,
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json({
      success: true,
      administradores: [],
      gestores: gestoresFormatted,
      consultores: consultoresFormatted,
      usuariosEstabelecimentos: usuariosEstabelecimentoFormatted,
      usuarios,
    });
  } catch (error) {
    console.error("[admin/usuarios] Error:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuarios" },
      { status: 500 },
    );
  }
}
