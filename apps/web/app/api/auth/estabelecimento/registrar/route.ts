import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@asa/database";
import { badRequest } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, senha, estabelecimentoId, nome } = body;

    if (!email || !senha || !estabelecimentoId || !nome) {
      return badRequest(
        "Campos obrigatórios: email, senha, estabelecimentoId, nome",
      );
    }

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return badRequest("Email inválido");
    }

    if (typeof senha !== "string" || senha.length < 6) {
      return badRequest("Senha deve ter no mínimo 6 caracteres");
    }

    // Verificar estabelecimento existe
    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
    });
    if (!estabelecimento) {
      return badRequest("Estabelecimento não encontrado");
    }

    // Verificar email único
    const existente = await prisma.usuarioEstabelecimento.findUnique({
      where: { email },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 },
      );
    }

    const senhaHash = await hash(senha, 12);

    const usuario = await prisma.usuarioEstabelecimento.create({
      data: {
        estabelecimentoId,
        nome,
        email,
        senhaHash,
        tipo: "PROPRIETARIO",
        ativo: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
