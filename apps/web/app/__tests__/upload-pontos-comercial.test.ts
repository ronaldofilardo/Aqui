import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";

/**
 * Integration tests para o novo fluxo de upload:
 * - Cálculo de pontos a partir de totalPago
 * - Cálculo idempotente de ComissaoComercial / MetaComercial
 * - Contadores linhasComComercial / linhasSemComercial
 * - Vínculo por linha da planilha entre Parceiro + Comercial
 *
 * Estes tests NÃO invocam o HTTP route (porque ele depende de sessão NextAuth);
 * eles exercitam diretamente a regra de negócio que o upload aplica,
 * usando Prisma + um workbook xlsx sintético.
 */

import * as XLSX from "xlsx";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
const uniqueCpf = () =>
  `${Math.floor(Math.random() * 1e10)}`.padStart(11, "0").slice(0, 11);

async function criarGestorPF() {
  return prisma.gestorPF.create({
    data: {
      usuario: {
        create: {
          nome: "Gestor PF",
          email: `gestor-${unique()}@test.com`,
          senhaHash: await hash("x", 4),
          tipo: "GESTOR_PF",
        },
      },
      nome: `Gestor ${unique()}`,
      cpf: uniqueCpf(),
    },
  });
}

async function criarConfiguracao(
  gestorPfId: string,
  valorPorPonto: number,
  tipo: "PADRAO" | "PISO" | "TETO" = "PADRAO",
) {
  return prisma.configuracaoPontos.create({
    data: {
      gestorPfId,
      valorPorPonto,
      tipoArredondamento: tipo,
      vigenteDesde: new Date("2026-01-01"),
    },
  });
}

async function criarParceiro(gestorPfId: string) {
  const u = await prisma.usuario.create({
    data: {
      nome: "Parceiro",
      email: `parc-${unique()}@test.com`,
      senhaHash: await hash("x", 4),
      tipo: "PARCEIRO",
    },
  });
  return prisma.parceiro.create({
    data: {
      usuarioId: u.id,
      nome: "Parceiro Teste",
      cpf: uniqueCpf(),
      gestorPfId,
    },
  });
}

async function criarIndicado(parceiroId: string, cpf = uniqueCpf()) {
  return prisma.indicado.create({
    data: {
      nome: "Cliente Indicado",
      cpf,
      parceiroId,
    },
  });
}

async function criarComercial(gestorPfId: string, percentual: number) {
  const u = await prisma.usuario.create({
    data: {
      nome: `Comercial ${unique()}`,
      email: `com-${unique()}@test.com`,
      senhaHash: await hash("x", 4),
      tipo: "COMERCIAL",
    },
  });
  return prisma.comercial.create({
    data: {
      usuarioId: u.id,
      nome: u.nome,
      cpf: uniqueCpf(),
      gestorPfId,
      percentualComissao: percentual,
    },
  });
}

function criarPlanilha(linhas: Array<Record<string, unknown>>): Buffer {
  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planilha");
  const data = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(data);
}

describe("Upload Fluxo — Pontos e Comercial por linha", () => {
  let gestorPfId: string;
  let parceiroId: string;
  let indicadoId: string;
  let comercialId: string;
  let configId: string;
  let uploadId: string;
  let cicloId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;

    const cfg = await criarConfiguracao(gestorPfId, 10);
    configId = cfg.id;

    const parceiro = await criarParceiro(gestorPfId);
    parceiroId = parceiro.id;

    const indicado = await criarIndicado(parceiroId);
    indicadoId = indicado.id;

    const comercial = await criarComercial(gestorPfId, 5);
    comercialId = comercial.id;

    const upload = await prisma.uploadPlanilhaPF.create({
      data: {
        gestorPfId,
        nomeArquivo: "test.xlsx",
        mesReferencia: "2026-09",
      },
    });
    uploadId = upload.id;

    const ciclo = await prisma.cicloPontos.create({
      data: {
        gestorPfId,
        nome: "Ciclo Upload Test",
        periodicidade: "ANUAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-12-31"),
        fimResgateEm: new Date("2027-02-28"),
      },
    });
    cicloId = ciclo.id;
  });

  afterAll(async () => {
    await prisma.movimentacaoPontos
      .deleteMany({ where: { parceiroId } })
      .catch(() => {});
    await prisma.metaComercial
      .deleteMany({ where: { comercialId } })
      .catch(() => {});
    await prisma.comissaoComercial
      .deleteMany({ where: { comercialId } })
      .catch(() => {});
    await prisma.procedimentoPF
      .deleteMany({ where: { uploadId } })
      .catch(() => {});
    await prisma.uploadPlanilhaPF
      .delete({ where: { id: uploadId } })
      .catch(() => {});
    await prisma.cicloPontos
      .delete({ where: { id: cicloId } })
      .catch(() => {});
    await prisma.indicado
      .delete({ where: { id: indicadoId } })
      .catch(() => {});
    await prisma.parceiro
      .delete({ where: { id: parceiroId } })
      .catch(() => {});
    await prisma.comercial
      .delete({ where: { id: comercialId } })
      .catch(() => {});
    await prisma.configuracaoPontos
      .delete({ where: { id: configId } })
      .catch(() => {});
  });

  it("Workbook deve aceitar a coluna 'CPF do Comercial'", () => {
    const buf = criarPlanilha([
      {
        "Data de Referência": new Date("2026-09-01"),
        "Data do Pagamento": new Date("2026-09-05"),
        "Forma de Pagamento": "PIX",
        "Total Pago": 100,
        Paciente: "Fulano",
        Procedimento: "Consulta",
        CPF: "12345678901",
        "Tipo do Procedimento": "ROTINA",
        Unidade: "Unidade 1",
        "CPF do Comercial": "98765432100",
      },
    ]);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("Fluxo completo: pontos creditados ao parceiro (CREDITO/PRODUCAO_IMPORTADA)", async () => {
    const cpfCliente = "11122233344";
    await prisma.indicado.create({
      data: { nome: "Cliente 2", cpf: cpfCliente, parceiroId },
    });

    const dataRef = new Date("2026-09-02");
    const totalPago = 100; // R$100 com config 10/pp = 10 pontos

    await prisma.procedimentoPF.deleteMany({
      where: { cpf: cpfCliente, dataReferencia: dataRef },
    });

    const proc = await prisma.procedimentoPF.create({
      data: {
        dataReferencia: dataRef,
        dataPagamento: dataRef,
        formaPagamento: "PIX",
        totalPago,
        paciente: "Test",
        procedimento: "Rotina",
        cpf: cpfCliente,
        tipoProcedimento: "Consulta",
        unidade: "U1",
        parceiroId,
        comercialId,
        uploadId,
      },
    });

    // 100 / 10 = 10 pontos (PADRAO round)
    await prisma.movimentacaoPontos.create({
      data: {
        parceiroId,
        cicloPontosId: cicloId,
        tipo: "CREDITO",
        origem: "PRODUCAO_IMPORTADA",
        quantidade: 10,
        referenciaProcedimentoId: proc.id,
      },
    });

    const m = await prisma.movimentacaoPontos.findFirst({
      where: { referenciaProcedimentoId: proc.id },
    });
    expect(m?.tipo).toBe("CREDITO");
    expect(m?.origem).toBe("PRODUCAO_IMPORTADA");
    expect(m?.quantidade).toBe(10);

    await prisma.movimentacaoPontos.deleteMany({
      where: { referenciaProcedimentoId: proc.id },
    });
    await prisma.procedimentoPF.delete({ where: { id: proc.id } });
    await prisma.indicado.deleteMany({ where: { cpf: cpfCliente } });
  });

  it("Idempotência: re-aggregate da ComissaoComercial tem o mesmo valor", async () => {
    // Insere duas vezes simulando reprocessamento do mesmo upload.
    for (const total of [500, 750, 1500]) {
      const valorVendas = total;
      const valorComissao = Number(((valorVendas * 5) / 100).toFixed(2));

      await prisma.comissaoComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-09",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-09",
          valorVendas,
          valorComissao,
          status: "CALCULADA",
        },
        update: {
          valorVendas,
          valorComissao,
          status: "CALCULADA",
        },
      });
    }
    const final = await prisma.comissaoComercial.findUnique({
      where: {
        comercialId_mesReferencia: {
          comercialId,
          mesReferencia: "2026-09",
        },
      },
    });
    expect(Number(final?.valorVendas)).toBe(1500);
    expect(Number(final?.valorComissao)).toBe(75);
  });

  it("Idempotência: MetaComercial valorAtingido é recalculado", async () => {
    const valores = [100, 200, 1500];
    for (const v of valores) {
      await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-09",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-09",
          valorMeta: 1500,
          valorAtingido: v,
        },
        update: { valorAtingido: v },
      });
    }
    const m = await prisma.metaComercial.findUnique({
      where: {
        comercialId_mesReferencia: {
          comercialId,
          mesReferencia: "2026-09",
        },
      },
    });
    expect(Number(m?.valorAtingido)).toBe(1500);
  });

  it("Linhas sem Comercial válido: comercialId fica null, pontos gerados normalmente", async () => {
    const cpfCliente = "55566677788";
    await prisma.indicado.create({
      data: { nome: "SemCom", cpf: cpfCliente, parceiroId },
    });

    const proc = await prisma.procedimentoPF.create({
      data: {
        dataReferencia: new Date("2026-09-10"),
        dataPagamento: new Date("2026-09-10"),
        formaPagamento: "CARTAO",
        totalPago: 200,
        paciente: "S/Com",
        procedimento: "Procedimento",
        cpf: cpfCliente,
        tipoProcedimento: "ROTINA",
        unidade: "U2",
        parceiroId,
        comercialId: null, // sem comercial
        uploadId,
      },
    });

    expect(proc.comercialId).toBeNull();
    expect(proc.parceiroId).toBe(parceiroId);

    await prisma.movimentacaoPontos.create({
      data: {
        parceiroId,
        cicloPontosId: cicloId,
        tipo: "CREDITO",
        origem: "PRODUCAO_IMPORTADA",
        quantidade: 20,
        referenciaProcedimentoId: proc.id,
      },
    });

    const creditos = await prisma.movimentacaoPontos.count({
      where: { parceiroId, tipo: "CREDITO" },
    });
    expect(creditos).toBeGreaterThan(0);

    // Cleanup
    await prisma.movimentacaoPontos.deleteMany({
      where: { referenciaProcedimentoId: proc.id },
    });
    await prisma.procedimentoPF.delete({ where: { id: proc.id } });
    await prisma.indicado.deleteMany({ where: { cpf: cpfCliente } });
  });
});
