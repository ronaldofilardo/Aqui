import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireConsultor, ok, created, badRequest } from "@/lib/api-helpers";
import { criarEstabelecimentoSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET() {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const estabelecimentos = await prisma.estabelecimento.findMany({
    where: { consultorId: session!.user.consultorId! },
    include: {
      cupomConfig: true,
      documentos: true,
      _count: { select: { usuarios: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return ok(estabelecimentos);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireConsultor();
  if (error) return error;

  const body = await req.json();
  const parsed = criarEstabelecimentoSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  // Check CNPJ uniqueness across the system
  if (parsed.data.cnpj) {
    const cnpjDigits = parsed.data.cnpj.replace(/\D/g, "");
    if (cnpjDigits.length === 14) {
      const existing = await prisma.estabelecimento.findFirst({
        where: {
          cnpj: {
            in: [
              parsed.data.cnpj,
              cnpjDigits,
              `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12)}`,
            ],
          },
        },
      });
      if (existing) {
        return badRequest("CNPJ já cadastrado no sistema");
      }
    }
  }

  const estab = await prisma.estabelecimento.create({
    data: {
      ...parsed.data,
      consultorId: session!.user.consultorId!,
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_ESTABELECIMENTO",
    entidade: "estabelecimento",
    entidadeId: estab.id,
    detalhes: { nomeFantasia: parsed.data.nomeFantasia },
  });

  return created(estab);
}
