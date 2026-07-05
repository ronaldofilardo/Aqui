import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";

export async function GET() {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const regra = await prisma.regraGestor.findUnique({
    where: { gestorPfId: gestorPfId! },
  });

  if (!regra) {
    return ok({
      gerenteCire: 0,
      supervisorAtivo: 0,
      supervisorReceptivo: 0,
      supervisorFranquia: 0,
      supervisorAtendimento: 0,
      gerenteAtendimento: 0,
      supervisorComercial: 0,
    });
  }

  return ok({
    id: regra.id,
    gerenteCire: Number(regra.gerenteCire),
    supervisorAtivo: Number(regra.supervisorAtivo),
    supervisorReceptivo: Number(regra.supervisorReceptivo),
    supervisorFranquia: Number(regra.supervisorFranquia),
    supervisorAtendimento: Number(regra.supervisorAtendimento),
    gerenteAtendimento: Number(regra.gerenteAtendimento),
    supervisorComercial: Number(regra.supervisorComercial),
  });
}

export async function POST(req: NextRequest) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  const {
    gerenteCire,
    supervisorAtivo,
    supervisorReceptivo,
    supervisorFranquia,
    supervisorAtendimento,
    gerenteAtendimento,
    supervisorComercial,
  } = body;

  const regra = await prisma.regraGestor.upsert({
    where: { gestorPfId: gestorPfId! },
    create: {
      gestorPfId: gestorPfId!,
      gerenteCire: gerenteCire || 0,
      supervisorAtivo: supervisorAtivo || 0,
      supervisorReceptivo: supervisorReceptivo || 0,
      supervisorFranquia: supervisorFranquia || 0,
      supervisorAtendimento: supervisorAtendimento || 0,
      gerenteAtendimento: gerenteAtendimento || 0,
      supervisorComercial: supervisorComercial || 0,
    },
    update: {
      gerenteCire: gerenteCire || 0,
      supervisorAtivo: supervisorAtivo || 0,
      supervisorReceptivo: supervisorReceptivo || 0,
      supervisorFranquia: supervisorFranquia || 0,
      supervisorAtendimento: supervisorAtendimento || 0,
      gerenteAtendimento: gerenteAtendimento || 0,
      supervisorComercial: supervisorComercial || 0,
    },
  });

  return ok({
    id: regra.id,
    gerenteCire: Number(regra.gerenteCire),
    supervisorAtivo: Number(regra.supervisorAtivo),
    supervisorReceptivo: Number(regra.supervisorReceptivo),
    supervisorFranquia: Number(regra.supervisorFranquia),
    supervisorAtendimento: Number(regra.supervisorAtendimento),
    gerenteAtendimento: Number(regra.gerenteAtendimento),
    supervisorComercial: Number(regra.supervisorComercial),
  });
}