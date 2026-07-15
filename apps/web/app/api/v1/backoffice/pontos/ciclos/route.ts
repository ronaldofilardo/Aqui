import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  created,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const CreateCicloSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  periodicidade: z.enum(["SEMESTRAL", "ANUAL"]),
  inicioAcumuloEm: z.string().datetime("Data inválida"),
  fimAcumuloEm: z.string().datetime("Data inválida"),
  fimResgateEm: z.string().datetime("Data inválida"),
});

export async function GET(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const ciclos = await prisma.cicloPontos.findMany({
      where: { backofficeId },
      orderBy: { inicioAcumuloEm: "desc" },
    });

    return ok({
      ciclos: ciclos.map((c) => ({
        id: c.id,
        nome: c.nome,
        periodicidade: c.periodicidade,
        inicioAcumuloEm: c.inicioAcumuloEm.toISOString(),
        fimAcumuloEm: c.fimAcumuloEm.toISOString(),
        fimResgateEm: c.fimResgateEm.toISOString(),
        status: c.status,
        processadoExpiracaoEm: c.processadoExpiracaoEm?.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar ciclos:", err);
    return badRequest("Erro ao buscar ciclos");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json();
    const validation = CreateCicloSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

  const { nome, periodicidade, inicioAcumuloEm, fimAcumuloEm, fimResgateEm } =
    validation.data;

  const inicio = new Date(inicioAcumuloEm);
  const fimAcumulo = new Date(fimAcumuloEm);
  const fimResgate = new Date(fimResgateEm);

  if (inicio >= fimAcumulo) {
    return badRequest(
      "Data de fim de acúmulo deve ser posterior à data de início",
    );
  }
  if (fimAcumulo >= fimResgate) {
    return badRequest(
      "Data de fim de resgate deve ser posterior à data de fim de acúmulo",
    );
  }

  // Verifica se já existe ciclo ATIVO desta MESMA periodicidade.
  // Ciclos SEMESTRAL e ANUAL podem coexistir.
  const cicloAtivo = await prisma.cicloPontos.findFirst({
    where: {
      backofficeId,
      periodicidade,
      OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
    },
  });

  if (cicloAtivo) {
    return badRequest(
      `Já existe um ciclo ${periodicidade} ativo. Encerre-o antes de criar um novo da mesma periodicidade.`,
    );
  }

  const novoCiclo = await prisma.cicloPontos.create({
    data: {
      backofficeId,
      nome,
      periodicidade,
      inicioAcumuloEm: inicio,
      fimAcumuloEm: fimAcumulo,
      fimResgateEm: fimResgate,
      status: "EM_ANDAMENTO",
    },
  });

  return created({
    id: novoCiclo.id,
    nome: novoCiclo.nome,
    periodicidade: novoCiclo.periodicidade,
    inicioAcumuloEm: novoCiclo.inicioAcumuloEm.toISOString(),
    fimAcumuloEm: novoCiclo.fimAcumuloEm.toISOString(),
    fimResgateEm: novoCiclo.fimResgateEm.toISOString(),
    status: novoCiclo.status,
    mensagem: "Ciclo de pontos criado com sucesso",
  });
  } catch (err) {
    console.error("Erro ao criar ciclo:", err);
    return badRequest("Erro ao criar ciclo");
  }
}

