import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  created,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const CreatePremioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  custoPontos: z.number().int().positive("Custo em pontos deve ser positivo"),
  imagemUrl: z.string().url("URL da imagem inválida").optional(),
});

const UpdatePremioSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  custoPontos: z.number().int().positive().optional(),
  imagemUrl: z.string().url().optional().or(z.literal("")),
  ativo: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const premios = await prisma.premio.findMany({
      where: { backofficeId },
      orderBy: { criadoEm: "desc" },
    });

    return ok({
      premios: premios.map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        custoPontos: p.custoPontos,
        imagemUrl: p.imagemUrl,
        ativo: p.ativo,
        criadoEm: p.criadoEm.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar prêmios:", err);
    return badRequest("Erro ao buscar prêmios");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json();
    const validation = CreatePremioSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { nome, descricao, custoPontos, imagemUrl } = validation.data;

    const novoPremio = await prisma.premio.create({
      data: {
        backofficeId,
        nome,
        descricao,
        custoPontos,
        imagemUrl,
        ativo: true,
      },
    });

    return created({
      id: novoPremio.id,
      nome: novoPremio.nome,
      descricao: novoPremio.descricao,
      custoPontos: novoPremio.custoPontos,
      imagemUrl: novoPremio.imagemUrl,
      ativo: novoPremio.ativo,
      mensagem: "Prêmio criado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao criar prêmio:", err);
    return badRequest("Erro ao criar prêmio");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const premioId = searchParams.get("id");

    if (!premioId) {
      return badRequest("ID do prêmio não fornecido");
    }

    const body = await req.json();
    const validation = UpdatePremioSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    // Verificar se o prêmio pertence ao gestor
    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio || premio.backofficeId !== backofficeId) {
      return forbidden();
    }

    const updated = await prisma.premio.update({
      where: { id: premioId },
      data: {
        ...(validation.data.nome && { nome: validation.data.nome }),
        ...(validation.data.descricao && {
          descricao: validation.data.descricao,
        }),
        ...(validation.data.custoPontos && {
          custoPontos: validation.data.custoPontos,
        }),
        ...(validation.data.imagemUrl !== undefined && {
          imagemUrl: validation.data.imagemUrl || null,
        }),
        ...(validation.data.ativo !== undefined && {
          ativo: validation.data.ativo,
        }),
      },
    });

    return ok({
      id: updated.id,
      nome: updated.nome,
      descricao: updated.descricao,
      custoPontos: updated.custoPontos,
      imagemUrl: updated.imagemUrl,
      ativo: updated.ativo,
      mensagem: "Prêmio atualizado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao atualizar prêmio:", err);
    return badRequest("Erro ao atualizar prêmio");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const premioId = searchParams.get("id");

    if (!premioId) {
      return badRequest("ID do prêmio não fornecido");
    }

    // Verificar se o prêmio pertence ao gestor
    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio || premio.backofficeId !== backofficeId) {
      return forbidden();
    }

    // Soft delete: desativar prêmio ao invés de deletar (preserva histórico de resgates)
    await prisma.premio.update({
      where: { id: premioId },
      data: { ativo: false },
    });

    return ok({
      id: premioId,
      mensagem: "Prêmio deletado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao deletar prêmio:", err);
    return badRequest("Erro ao deletar prêmio");
  }
}

