import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestor, ok, badRequest } from "@/lib/api-helpers";
import {
  parseCupomFile,
  importarCuponsSchema,
} from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { session, error } = await requireGestor();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const mesRef = formData.get("mes_referencia");
  const anoRef = formData.get("ano_referencia");

  if (!file) return badRequest("Arquivo é obrigatório");

  const metaParsed = importarCuponsSchema.safeParse({
    mesReferencia: Number(mesRef),
    anoReferencia: Number(anoRef),
  });
  if (!metaParsed.success) {
    return badRequest(metaParsed.error.errors.map((e) => e.message).join(", "));
  }

  const { mesReferencia, anoReferencia } = metaParsed.data;

  // Read and parse the file with encoding detection (Windows-1252 fallback)
  const buffer = await file.arrayBuffer();
  let content = new TextDecoder("utf-8").decode(buffer);
  if (content.includes("\uFFFD")) {
    content = new TextDecoder("windows-1252").decode(buffer);
  }
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const resultado = parseCupomFile(content);

  if (resultado.erros.length > 0 && resultado.dados.length === 0) {
    return ok({
      sucesso: false,
      resumo: {
        total_linhas: resultado.totalLinhas,
        importados: 0,
        erros: resultado.erros.length,
      },
      erros: resultado.erros,
      cupons_importados: [],
    });
  }

  // Validate against database (batch lookup to avoid N+1)
  const codigosCupom = resultado.dados.map(
    (d: (typeof resultado.dados)[0]) => d.nomeCupom,
  );
  const cupomConfigs = await prisma.cupomConfig.findMany({
    where: { codigoCupom: { in: codigosCupom } },
    include: { estabelecimento: true },
  });
  const cupomConfigsMap = new Map(
    cupomConfigs.map((c: (typeof cupomConfigs)[0]) => [c.codigoCupom, c]),
  );

  const dbErros: Array<{ linha: number; campo: string; mensagem: string }> = [];
  const validados: Array<{
    cupomConfigId: string;
    estabelecimentoId: string;
    consultorId: string;
    pacienteNome: string;
    pacienteCpf: string;
    preco: number;
    desconto: number;
    agendamento: Date;
    codigo: string;
  }> = [];

  for (let i = 0; i < resultado.dados.length; i++) {
    const item = resultado.dados[i];
    const linhaNum = i + 2;

    const cupomConfig = cupomConfigsMap.get(item.nomeCupom);

    if (!cupomConfig) {
      dbErros.push({
        linha: linhaNum,
        campo: "nome_cupom",
        mensagem: `Cupom '${item.nomeCupom}' não cadastrado no sistema`,
      });
      continue;
    }

    if (cupomConfig.status !== "ATIVO") {
      dbErros.push({
        linha: linhaNum,
        campo: "nome_cupom",
        mensagem: `Cupom '${item.nomeCupom}' está inativo`,
      });
      continue;
    }

    // Check if local matches the estabelecimento
    const nomeEstab = cupomConfig.estabelecimento.nomeFantasia.toLowerCase();
    const localNormalizado = item.local.toLowerCase();
    if (
      !nomeEstab.includes(localNormalizado) &&
      !localNormalizado.includes(nomeEstab)
    ) {
      // Flexible match - warn but don't block
    }

    validados.push({
      cupomConfigId: cupomConfig.id,
      estabelecimentoId: cupomConfig.estabelecimento.id,
      consultorId: cupomConfig.estabelecimento.consultorId,
      pacienteNome: item.paciente,
      pacienteCpf: item.cpf,
      preco: item.preco,
      desconto: item.desconto,
      agendamento: item.agendamento,
      codigo: item.nomeCupom,
    });
  }

  const allErros = [...resultado.erros, ...dbErros];

  // Atomic import + Consultor totals inside single transaction
  const importados = await prisma.$transaction(async (tx) => {
    const created = [];
    const countByConsultor = new Map<string, number>();

    for (const item of validados) {
      const precoFinal = item.preco * (1 - item.desconto / 100);
      const cupom = await tx.cupomImportado.create({
        data: {
          cupomConfigId: item.cupomConfigId,
          pacienteNome: item.pacienteNome,
          pacienteCpf: item.pacienteCpf,
          campanha: "Acesso Saude Aqui",
          servico: "Cupom",
          precoOriginal: item.preco,
          descontoPercentual: item.desconto,
          precoFinal,
          mesReferencia: mesReferencia,
          anoReferencia: anoReferencia,
          status: "USADO",
        },
      });
      await tx.consulta.create({
        data: {
          cupomImportadoId: cupom.id,
          status: "REALIZADA",
          dataAgendamento: item.agendamento,
          dataRealizacao: new Date(),
          valorPago: precoFinal,
        },
      });
      created.push({
        id: cupom.id,
        codigo: item.codigo,
        paciente: item.pacienteNome,
      });
      countByConsultor.set(
        item.consultorId,
        (countByConsultor.get(item.consultorId) ?? 0) + 1,
      );
    }

    // Update consultor totalConsultas
    for (const [consultorId, count] of countByConsultor.entries()) {
      await tx.consultor.update({
        where: { id: consultorId },
        data: {
          totalConsultas: { increment: count },
        },
      });
    }

    return created;
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "IMPORTAR_CUPONS",
    entidade: "cupom_importado",
    detalhes: {
      mesReferencia,
      anoReferencia,
      totalImportados: importados.length,
      totalErros: allErros.length,
    },
  });

  return ok({
    sucesso: true,
    resumo: {
      total_linhas: resultado.totalLinhas,
      importados: importados.length,
      erros: allErros.length,
    },
    erros: allErros,
    cupons_importados: importados,
  });
}
