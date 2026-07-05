import { NextRequest } from "next/server";
import {
  requireGestorPFWithScope,
  badRequest,
  ok,
  unauthorized,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Schema de validação
const CreateConfigSchema = z.object({
  valorPorPonto: z.number().positive("Valor por ponto deve ser positivo"),
  tipoArredondamento: z.enum(["PISO", "TETO", "PADRAO"]),
});

const UpdateConfigSchema = z.object({
  valorPorPonto: z.number().positive().optional(),
  tipoArredondamento: z.enum(["PISO", "TETO", "PADRAO"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { session, gestorPfId, error } = await requireGestorPFWithScope();
    if (error) return error;

    const configs = await prisma.configuracaoPontos.findMany({
      where: { gestorPfId },
      orderBy: { vigenteDesde: "desc" },
    });

    return ok({
      configuracoes: configs.map((c) => ({
        id: c.id,
        valorPorPonto: c.valorPorPonto.toString(),
        tipoArredondamento: c.tipoArredondamento,
        vigenteDesde: c.vigenteDesde.toISOString(),
        vigenteAte: c.vigenteAte?.toISOString(),
        vigente: !c.vigenteAte || c.vigenteAte > new Date(),
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar configurações:", err);
    return badRequest("Erro ao buscar configurações");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, gestorPfId, error } = await requireGestorPFWithScope();
    if (error) return error;

    const body = await req.json();
    const validation = CreateConfigSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { valorPorPonto, tipoArredondamento } = validation.data;

    // Encerrar configuração anterior se houver
    const configAnterior = await prisma.configuracaoPontos.findFirst({
      where: {
        gestorPfId,
        vigenteAte: null,
      },
    });

    if (configAnterior) {
      await prisma.configuracaoPontos.update({
        where: { id: configAnterior.id },
        data: { vigenteAte: new Date() },
      });
    }

    // Criar nova configuração
    const novaConfig = await prisma.configuracaoPontos.create({
      data: {
        gestorPfId,
        valorPorPonto: new Decimal(valorPorPonto),
        tipoArredondamento,
        vigenteDesde: new Date(),
        criadoPor: session?.user.id,
      },
    });

    return ok({
      id: novaConfig.id,
      valorPorPonto: novaConfig.valorPorPonto.toString(),
      tipoArredondamento: novaConfig.tipoArredondamento,
      vigenteDesde: novaConfig.vigenteDesde.toISOString(),
      vigenteAte: novaConfig.vigenteAte?.toISOString(),
      mensagem: "Configuração criada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao criar configuração:", err);
    return badRequest("Erro ao criar configuração");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, gestorPfId, error } = await requireGestorPFWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return badRequest("ID da configuração não fornecido");
    }

    const body = await req.json();
    const validation = UpdateConfigSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    // Verificar se a configuração pertence ao gestor
    const config = await prisma.configuracaoPontos.findUnique({
      where: { id: configId },
    });

    if (!config || config.gestorPfId !== gestorPfId) {
      return forbidden();
    }

    // Se houver data de vigência anterior, não pode modificar
    if (config.vigenteAte) {
      return badRequest("Não é possível modificar uma configuração encerrada");
    }

    const updated = await prisma.configuracaoPontos.update({
      where: { id: configId },
      data: {
        ...(validation.data.valorPorPonto && {
          valorPorPonto: new Decimal(validation.data.valorPorPonto),
        }),
        ...(validation.data.tipoArredondamento && {
          tipoArredondamento: validation.data.tipoArredondamento,
        }),
      },
    });

    return ok({
      id: updated.id,
      valorPorPonto: updated.valorPorPonto.toString(),
      tipoArredondamento: updated.tipoArredondamento,
      vigenteDesde: updated.vigenteDesde.toISOString(),
      mensagem: "Configuração atualizada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao atualizar configuração:", err);
    return badRequest("Erro ao atualizar configuração");
  }
}
