import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const lideranca = await prisma.lideranca.findUnique({
    where: { id: params.id },
    include: {
      comerciais: {
        include: {
          usuario: {
            select: { email: true, status: true },
          },
          parceiros: {
            include: {
              usuario: {
                select: { email: true },
              },
            },
          },
        },
      },
      gestores: {
        include: {
          usuario: {
            select: { email: true, status: true },
          },
          parceiros: {
            include: {
              usuario: {
                select: { email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!lideranca) {
    return notFound("Liderança não encontrada");
  }

  if (lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }

  return ok({
    lideranca: {
      id: lideranca.id,
      nome: lideranca.nome,
      tipo: lideranca.tipo,
    },
    equipe: {
      comerciais: lideranca.comerciais.map((c) => ({
        id: c.id,
        nome: c.nome,
        email: c.usuario.email,
        status: c.usuario.status,
        cpf: c.cpf,
        funcao: c.funcao,
        parceiros: c.parceiros.map((p) => ({
          id: p.id,
          nome: p.nome,
          email: p.usuario.email,
          cpf: p.cpf,
          status: p.status,
        })),
      })),
      gestores: lideranca.gestores.map((g) => ({
        id: g.id,
        nome: g.nome,
        email: g.usuario.email,
        status: g.usuario.status,
        cpf: g.cpf,
        parceiros: g.parceiros.map((p) => ({
          id: p.id,
          nome: p.nome,
          email: p.usuario.email,
          cpf: p.cpf,
          status: p.status,
        })),
      })),
    },
    resumo: {
      totalComerciais: lideranca.comerciais.length,
      totalGestores: lideranca.gestores.length,
      totalParceiros:
        lideranca.comerciais.reduce((acc, c) => acc + c.parceiros.length, 0) +
        lideranca.gestores.reduce((acc, g) => acc + g.parceiros.length, 0),
    },
  });
}
