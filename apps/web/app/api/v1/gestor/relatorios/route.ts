import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestorWithScope, ok, badRequest } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, consultorIds } = await requireGestorWithScope();
  if (error) return error;

  const url = new URL(req.url);
  const tipo = url.searchParams.get("tipo") || "consultas";
  const mes = Number(url.searchParams.get("mes")) || undefined;
  const ano = Number(url.searchParams.get("ano")) || undefined;
  const formato = url.searchParams.get("formato") || "json";

  let data: unknown[] = [];

  if (tipo === "consultas") {
    data = await prisma.consulta.findMany({
      where: {
        cupomImportado: {
          cupomConfig: {
            estabelecimento: { consultorId: { in: consultorIds } },
          },
        },
      },
      include: {
        cupomImportado: {
          include: {
            cupomConfig: {
              include: { estabelecimento: { select: { nomeFantasia: true } } },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    });
  } else {
    return badRequest("Tipo deve ser 'consultas'");
  }

  if (formato === "csv") {
    const rows = data as Record<string, unknown>[];
    if (rows.length === 0) {
      return new Response("Sem dados", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    const flattenObj = (
      obj: Record<string, unknown>,
      prefix = "",
    ): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const [key, val] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (
          val &&
          typeof val === "object" &&
          !Array.isArray(val) &&
          !(val instanceof Date)
        ) {
          Object.assign(
            result,
            flattenObj(val as Record<string, unknown>, newKey),
          );
        } else {
          result[newKey] = String(val ?? "");
        }
      }
      return result;
    };

    const flatRows = rows.map((r: any) => flattenObj(r));
    const headers = Object.keys(flatRows[0]);
    const csvLines = [
      headers.join(";"),
      ...flatRows.map((r: any) =>
        headers
          .map((h: any) => `"${(r[h] || "").replace(/"/g, '""')}"`)
          .join(";"),
      ),
    ];
    const csv = csvLines.join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=relatorio_${tipo}_${mes || "todos"}_${ano || "todos"}.csv`,
      },
    });
  }

  return ok(data);
}
