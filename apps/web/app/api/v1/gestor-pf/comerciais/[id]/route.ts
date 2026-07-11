import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireGestorPFWithScope,
} from "@/lib/api-helpers";
import { atualizarComercialSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  // Buscar comercial e verificar se pertence a uma liderança deste gestor-pf
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      lideranca: {
        select: { gestorPfId: true },
      },
      usuario: {
        select: { id: true, email: true, status: true },
      },
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  // Verificar se a liderança pertence a este gestor-pf
  if (comercial.lideranca.gestorPfId !== gestorPfId) {
    return forbidden();
  }

  return ok({
    id: comercial.id,
    nome: comercial.nome,
    cpf: comercial.cpf,
    email: comercial.usuario.email,
    percentualComissao: comercial.percentualComissao,
    status: comercial.status,
    createdAt: comercial.createdAt,
    liderancaId: comercial.liderancaId,
    tipoLideranca: comercial.tipoLideranca,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = atualizarComercialSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  // Buscar comercial e verificar permissão
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: { 
      usuario: true,
      lideranca: { select: { gestorPfId: true } }
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  // Verificar se a liderança pertence a este gestor-pf
  if (comercial.lideranca.gestorPfId !== gestorPfId) {
    return forbidden();
  }

  const dataToUpdate: any = { ...parsed.data };
  
  if (dataToUpdate.percentualComissao !== undefined) {
    dataToUpdate.percentualComissao =
      typeof dataToUpdate.percentualComissao === "string"
        ? parseFloat(dataToUpdate.percentualComissao)
        : dataToUpdate.percentualComissao;
  }

  if (dataToUpdate.lideranca !== undefined) {
    dataToUpdate.tipoLideranca = dataToUpdate.lideranca;
    delete dataToUpdate.lideranca;
  }

  const usuarioUpdate: any = {};
  if (dataToUpdate.nome) {
    usuarioUpdate.nome = dataToUpdate.nome;
    delete dataToUpdate.nome;
  }
  if (dataToUpdate.email) {
    usuarioUpdate.email = dataToUpdate.email.toLowerCase().trim();
    delete dataToUpdate.email;
  }
  if (dataToUpdate.status) {
    usuarioUpdate.status = dataToUpdate.status;
    delete dataToUpdate.status;
  }

  const updated = await prisma.comercial.update({
    where: { id: params.id },
    data: dataToUpdate,
  });

  if (Object.keys(usuarioUpdate).length > 0) {
    await prisma.usuario.update({
      where: { id: comercial.usuarioId },
      data: usuarioUpdate,
    });
  }

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_COMERCIAL",
    entidade: "comercial",
    entidadeId: params.id,
    detalhes: parsed.data,
  });

  return ok(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, gestorPfId, error } = await requireGestorPFWithScope();
  if (error) return error;

  // Buscar comercial e verificar permissão
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: { 
      usuario: true,
      comissoes: true,
      metas: true,
      procedimentos: true,
      lideranca: { select: { gestorPfId: true } }
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  // Verificar se a liderança pertence a este gestor-pf
  if (comercial.lideranca.gestorPfId !== gestorPfId) {
    return forbidden();
  }

  try {
    // Deletar registros relacionados primeiro
    await Promise.all([
      // Deletar comissões
      prisma.comissaoComercial.deleteMany({
        where: { comercialId: params.id },
      }),
      // Deletar metas
      prisma.metaComercial.deleteMany({
        where: { comercialId: params.id },
      }),
      // Deletar procedimentos
      prisma.procedimentoPF.deleteMany({
        where: { comercialId: params.id },
      }),
    ]);

    // Deletar o usuário associado (se existir)
    if (comercial.usuarioId) {
      await prisma.usuario.delete({
        where: { id: comercial.usuarioId },
      }).catch((err) => {
        console.error("Erro ao deletar usuário:", err.message);
        // Ignora erro se o usuário já foi deletado ou não existe
      });
    }

    // Deletar o comercial
    await prisma.comercial.delete({
      where: { id: params.id },
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "DELETAR_COMERCIAL",
      entidade: "comercial",
      entidadeId: params.id,
      detalhes: { nome: comercial.nome, cpf: comercial.cpf },
    });

    return ok({ message: "Comercial deletado com sucesso" });
  } catch (error: any) {
    console.error("Erro ao deletar comercial:", error);
    return badRequest("Erro ao deletar comercial: " + error.message);
  }
}


