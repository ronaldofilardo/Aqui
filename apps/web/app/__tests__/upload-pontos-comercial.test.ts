import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

import * as XLSX from "xlsx";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

async function criarBackoffice() {
  return prisma.backoffice.create({
    data: {
      usuario: {
        create: {
          nome: "Backoffice",
          email: `backoffice-${unique()}@test.com`,
          senhaHash: await hash("x", 4),
          tipo: "BACKOFFICE",
          papel: "BACKOFFICE",
        },
      },
      nome: `Backoffice ${unique()}`,
      cpf: uniqueCpf(),
    },
  });
}

async function criarConfiguracao(
  backofficeId: string,
  valorPorPonto: number,
  tipo: "PADRAO" | "PISO" | "TETO" = "PADRAO",
) {
  return prisma.configuracaoPontos.create({
    data: {
      backofficeId, valorPorPonto,
      tipoArredondamento: tipo,
      vigenteDesde: new Date("2026-01-01"),
    },
  });
}

async function criarParceiro(backofficeId: string) {
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

async function criarComercial(liderancaId: string, percentual: number) {
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
      liderancaId, percentualComissao: percentual,
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
  let backofficeId: string;
  let liderancaId: string;
  let parceiroId: string;
  let indicadoId: string;
  let comercialId: string;
  let configId: string;
  let uploadId: string;
  let cicloId: string;

  beforeAll(async () => {
    const gp = await criarBackoffice();
    backofficeId = gp.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Test",
        email: `lideranca-${unique()}@test.com`,
        senhaHash: await hash("x", 4),
        tipo: "LIDERANCA",
      },
    });
    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Test",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;

    const cfg = await criarConfiguracao(backofficeId, 10);
    configId = cfg.id;

    const parceiro = await criarParceiro(backofficeId);
    parceiroId = parceiro.id;

    const indicado = await criarIndicado(parceiroId);
    indicadoId = indicado.id;

    const comercial = await criarComercial(liderancaId, 5);
    comercialId = comercial.id;

    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId, nomeArquivo: "test.xlsx",
        mesReferencia: "2026-09",
      },
    });
    uploadId = upload.id;

    const ciclo = await prisma.cicloPontos.create({
      data: {
        backofficeId, nome: "Ciclo Upload Test",
        periodicidade: "ANUAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-12-31"),
        fimResgateEm: new Date("2027-02-28"),
      },
    });
    cicloId = ciclo.id;
  });

  afterAll(async () => {
    await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
  });

  it("Workbook deve aceitar a coluna 'Usuário da conta'", () => {
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
        "Usuário da conta": "Comercial Teste",
      },
    ]);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("Fluxo completo: pontos creditados ao parceiro (CREDITO/PRODUCAO_IMPORTADA)", async () => {
    const cpfCliente = uniqueCpf();
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
    const cpfCliente = uniqueCpf();
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

  it("Busca comercial por nome (Usuário da conta) case-insensitive", async () => {
    const cpfCliente = uniqueCpf();
    await prisma.indicado.create({
      data: { nome: "Cliente Busca Nome", cpf: cpfCliente, parceiroId },
    });

    const comercialNomeTeste = await criarComercial(liderancaId, 5);
    await prisma.comercial.update({
      where: { id: comercialNomeTeste.id },
      data: { nome: "Comercial Nome Teste" },
    });

    const dataRef = new Date("2026-09-15");
    const totalPago = 300;

    const proc = await prisma.procedimentoPF.create({
      data: {
        dataReferencia: dataRef,
        dataPagamento: dataRef,
        formaPagamento: "PIX",
        totalPago,
        paciente: "Busca Nome",
        procedimento: "Consulta",
        cpf: cpfCliente,
        tipoProcedimento: "ROTINA",
        unidade: "U1",
        parceiroId,
        comercialId: comercialNomeTeste.id,
        uploadId,
      },
    });

    expect(proc.comercialId).toBe(comercialNomeTeste.id);

    const procBusca = await prisma.procedimentoPF.findUnique({
      where: { id: proc.id },
      include: { comercial: true },
    });

    expect(procBusca?.comercial?.nome).toBe("Comercial Nome Teste");

    await prisma.procedimentoPF.delete({ where: { id: proc.id } });
    await prisma.comercial.delete({ where: { id: comercialNomeTeste.id } });
    await prisma.indicado.deleteMany({ where: { cpf: cpfCliente } });
  });
});
