import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok } from "@/lib/api-helpers";
import { indicarClienteSchema } from "@asa/shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = indicarClienteSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        parsed.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { cpfParceiro, cpfIndicado, nomeIndicado, telefoneIndicado } =
      parsed.data;

    const cpfParceiroClean = cpfParceiro.replace(/\D/g, "");
    const cpfIndicadoClean = cpfIndicado.replace(/\D/g, "");

    const parceiro = await prisma.parceiro.findUnique({
      where: { cpf: cpfParceiroClean },
      include: {
        gestorPf: {
          select: { id: true, nome: true },
        },
      },
    });

    if (!parceiro) {
      return notFound("Parceiro não encontrado");
    }

    if (parceiro.status === "DESLIGADO") {
      return badRequest(
        "Este parceiro está desligado e não pode mais indicar clientes"
      );
    }

    const indicadoExistente = await prisma.indicado.findUnique({
      where: { cpf: cpfIndicadoClean },
    });

    if (indicadoExistente) {
      return badRequest(
        "Este CPF já está vinculado a um parceiro. Cada cliente pode ser indicado por apenas um parceiro."
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const indicado = await tx.indicado.create({
        data: {
          nome: nomeIndicado,
          cpf: cpfIndicadoClean,
          telefone: telefoneIndicado || null,
          parceiroId: parceiro.id,
          status: "ATIVO",
        },
      });

      return indicado;
    });

    return ok({
      message: "Cliente indicado com sucesso",
      indicado: {
        id: resultado.id,
        nome: resultado.nome,
        cpf: resultado.cpf,
      },
      parceiro: {
        id: parceiro.id,
        nome: parceiro.nome,
      },
    });
  } catch (error) {
    console.error("[indicar] Erro ao indicar cliente:", error);
    return badRequest("Erro ao processar indicação");
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cpf = searchParams.get("cpf");

  if (!cpf) {
    return badRequest("CPF é obrigatório");
  }

  const cpfClean = cpf.replace(/\D/g, "");

  if (cpfClean.length !== 11) {
    return badRequest("CPF inválido");
  }

  const parceiro = await prisma.parceiro.findUnique({
    where: { cpf: cpfClean },
    select: {
      id: true,
      nome: true,
      cpf: true,
      status: true,
      gestorPf: {
        select: {
          id: true,
          nome: true,
        },
      },
      _count: {
        select: { indicacoes: true },
      },
    },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  return ok(parceiro);
}