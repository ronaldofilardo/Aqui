import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireLiderancaWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const liderancaData = await prisma.lideranca.findUnique({
    where: { id: lideranca!.id },
    include: {
      comerciais: {
        include: {
          parceiros: {
            include: { usuario: { select: { email: true } } }
          },
          usuario: { select: { email: true } }
        },
      },
      gestores: {
        include: {
          parceiros: {
            include: { usuario: { select: { email: true } } }
          },
          usuario: { select: { email: true } }
        },
      },
    },
  });

  const equipe = {
    comerciais: liderancaData?.comerciais.map((c) => ({
      id: c.id,
      nome: c.nome,
      email: c.usuario?.email,
      cpf: c.cpf,
      funcao: c.funcao,
      parceiros: c.parceiros.map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.usuario?.email,
        cpf: p.cpf,
        status: p.status,
      })),
    })),
    gestores: liderancaData?.gestores.map((g) => ({
      id: g.id,
      nome: g.nome,
      email: g.usuario?.email,
      cpf: g.cpf,
      parceiros: g.parceiros.map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.usuario?.email,
        cpf: p.cpf,
        status: p.status,
      })),
    })),
  };

  const resumo = {
    totalComerciais: equipe.comerciais?.length || 0,
    totalGestores: equipe.gestores?.length || 0,
    totalParceiros:
      (equipe.comerciais?.reduce((acc, c) => acc + c.parceiros.length, 0) || 0) +
      (equipe.gestores?.reduce((acc, g) => acc + g.parceiros.length, 0) || 0),
  };

  return ok({
    lideranca: {
      id: liderancaData?.id,
      nome: liderancaData?.nome,
      tipo: liderancaData?.tipo,
    },
    equipe,
    resumo,
  });
}