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

  const regra = await prisma.regraComercial.findUnique({
    where: { gestorPfId: gestorPfId! },
  });

  if (!regra) {
    return ok({
      cartaoAcessoSaude: 0,
      cireAtivo: 0,
      cireReceptivo: 0,
      franchisingAcesso: 0,
      franchisingCartao: 0,
      unidade: 0,
    });
  }

  return ok({
    id: regra.id,
    cartaoAcessoSaude: Number(regra.cartaoAcessoSaude),
    cireAtivo: Number(regra.cireAtivo),
    cireReceptivo: Number(regra.cireReceptivo),
    franchisingAcesso: Number(regra.franchisingAcesso),
    franchisingCartao: Number(regra.franchisingCartao),
    unidade: Number(regra.unidade),
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
    cartaoAcessoSaude,
    cireAtivo,
    cireReceptivo,
    franchisingAcesso,
    franchisingCartao,
    unidade,
  } = body;

  const regra = await prisma.regraComercial.upsert({
    where: { gestorPfId: gestorPfId! },
    create: {
      gestorPfId: gestorPfId!,
      cartaoAcessoSaude: cartaoAcessoSaude || 0,
      cireAtivo: cireAtivo || 0,
      cireReceptivo: cireReceptivo || 0,
      franchisingAcesso: franchisingAcesso || 0,
      franchisingCartao: franchisingCartao || 0,
      unidade: unidade || 0,
    },
    update: {
      cartaoAcessoSaude: cartaoAcessoSaude || 0,
      cireAtivo: cireAtivo || 0,
      cireReceptivo: cireReceptivo || 0,
      franchisingAcesso: franchisingAcesso || 0,
      franchisingCartao: franchisingCartao || 0,
      unidade: unidade || 0,
    },
  });

  return ok({
    id: regra.id,
    cartaoAcessoSaude: Number(regra.cartaoAcessoSaude),
    cireAtivo: Number(regra.cireAtivo),
    cireReceptivo: Number(regra.cireReceptivo),
    franchisingAcesso: Number(regra.franchisingAcesso),
    franchisingCartao: Number(regra.franchisingCartao),
    unidade: Number(regra.unidade),
  });
}