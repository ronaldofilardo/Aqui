import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireConsultor, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const url = new URL(req.url);
  const mes = Number(url.searchParams.get("mes")) || new Date().getMonth() + 1;
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();

  const comissoes = await prisma.comissao.findMany({
    where: {
      consultorId: session!.user.consultorId!,
      mesReferencia: mes,
      anoReferencia: ano,
    },
    include: {
      consulta: true,
      estabelecimento: { select: { nomeFantasia: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  const total = comissoes.reduce(
    (sum: number, c) => sum + Number(c.valorConsultor),
    0,
  );

  return ok({
    mes,
    ano,
    comissoes,
    totalConsultas: comissoes.length,
    totalComissao: total,
  });
}
