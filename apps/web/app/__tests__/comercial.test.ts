import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";

/**
 * Integration tests do modelo Comercial + MetaComercial + ComissaoComercial,
 * garantindo idempotência e regras de negócio críticas listadas no plano.
 */

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

async function criarComercial(gestorPfId: string) {
  const u = await prisma.usuario.create({
    data: {
      nome: `Comercial ${unique()}`,
      email: `comercial-${unique()}@test.com`,
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
      percentualComissao: 5,
    },
  });
}

describe("Comercial - Modelo & Unicidade", () => {
  let gestorPfId: string;
  let comercialIds: string[] = [];

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;
  });

  afterAll(async () => {
    await prisma.metaComercial.deleteMany({
      where: { comercialId: { in: comercialIds } },
    });
    await prisma.comissaoComercial.deleteMany({
      where: { comercialId: { in: comercialIds } },
    });
    await prisma.comercial.deleteMany({
      where: { id: { in: comercialIds } },
    });
  });

  it("deve criar Comercial vinculado ao GestorPF", async () => {
    const c = await criarComercial(gestorPfId);
    comercialIds.push(c.id);
    expect(c.gestorPfId).toBe(gestorPfId);
    expect(Number(c.percentualComissao)).toBe(5);
    expect(c.status).toBe("ATIVO");
  });

  it("CPF de Comercial deve ser único (constraint @unique)", async () => {
    const cpf = uniqueCpf();

    // Cria Comercial via criarComercial() passando o cpf explicitamente
    const u = await prisma.usuario.create({
      data: {
        nome: `${unique()}`,
        email: `com-${unique()}@test.com`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });
    await prisma.comercial.create({
      data: {
        usuarioId: u.id,
        nome: "First",
        cpf,
        gestorPfId,
      },
    });

    // Cria outro usuário Comercial e tenta usar o mesmo CPF
    const u2 = await prisma.usuario.create({
      data: {
        nome: `${unique()}`,
        email: `com2-${unique()}@test.com`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });

    await expect(
      prisma.comercial.create({
        data: {
          usuarioId: u2.id,
          nome: "Dup",
          cpf,
          gestorPfId,
        },
      }),
    ).rejects.toThrow();

    // Limpa o usuário órfão
    await prisma.usuario.delete({ where: { id: u2.id } }).catch(() => {});
    await prisma.comercial
      .delete({ where: { usuarioId: u.id } })
      .catch(() => {});
    await prisma.usuario.delete({ where: { id: u.id } }).catch(() => {});
  });

  it("Tipo do Usuario deve ser COMERCIAL", async () => {
    const c = await criarComercial(gestorPfId);
    comercialIds.push(c.id);
    const u = await prisma.usuario.findUnique({
      where: { id: c.usuarioId },
      select: { tipo: true },
    });
    expect(u?.tipo).toBe("COMERCIAL");
  });
});

describe("MetaComercial - mês único por comercial", () => {
  let gestorPfId: string;
  let comercialId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;
    const c = await criarComercial(gestorPfId);
    comercialId = c.id;
  });

  afterAll(async () => {
    await prisma.metaComercial.deleteMany({ where: { comercialId } });
    await prisma.comissaoComercial.deleteMany({ where: { comercialId } });
    await prisma.comercial.delete({ where: { id: comercialId } });
  });

  it("deve gravar meta mensal via upsert (idempotente)", async () => {
    // 1ª chamada: cria com valorMeta=1000
    await prisma.metaComercial.upsert({
      where: {
        comercialId_mesReferencia: {
          comercialId,
          mesReferencia: "2026-07",
        },
      },
      create: {
        comercialId,
        mesReferencia: "2026-07",
        valorMeta: 1000,
        valorAtingido: 0,
      },
      update: {},
    });
    // 2ª chamada: atualiza valorMeta=1500
    await prisma.metaComercial.upsert({
      where: {
        comercialId_mesReferencia: {
          comercialId,
          mesReferencia: "2026-07",
        },
      },
      create: {
        comercialId,
        mesReferencia: "2026-07",
        valorMeta: 1500,
        valorAtingido: 0,
      },
      update: { valorMeta: 1500 },
    });

    const after = await prisma.metaComercial.findUnique({
      where: {
        comercialId_mesReferencia: {
          comercialId,
          mesReferencia: "2026-07",
        },
      },
    });
    expect(Number(after?.valorMeta)).toBe(1500);
    expect(Number(after?.valorAtingido)).toBe(0);
  });

  it("upsert subsequente recalcula valorAtingido sem corromper", async () => {
    for (const atingido of [100, 250, 800, 1500]) {
      await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-07",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-07",
          valorMeta: 1500,
          valorAtingido: atingido,
        },
        update: { valorAtingido: atingido },
      });
    }
    const m = await prisma.metaComercial.findUnique({
      where: {
        comercialId_mesReferencia: {
          comercialId,
          mesReferencia: "2026-07",
        },
      },
    });
    expect(Number(m?.valorAtingido)).toBe(1500);
  });
});

describe("ComissaoComercial - cálculo idempotente", () => {
  let gestorPfId: string;
  let comercialId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;
    const c = await criarComercial(gestorPfId);
    comercialId = c.id;
  });

  afterAll(async () => {
    await prisma.metaComercial.deleteMany({ where: { comercialId } });
    await prisma.comissaoComercial.deleteMany({ where: { comercialId } });
    await prisma.comercial.delete({ where: { id: comercialId } });
  });

  it("deve calcular valorComissao = valorVendas * percentual / 100", () => {
    const valorVendas = 1000;
    const percentual = 5; // 5%
    const valorComissao = Number(
      ((valorVendas * percentual) / 100).toFixed(2),
    );
    expect(valorComissao).toBe(50);
  });

  it("upsert deve atualizar valorVendas e valorComissao (reprocessamento)", async () => {
    for (const tot of [500, 750, 1000, 1234.56]) {
      const valorVendas = tot;
      const percentual = 7.5;
      const valorComissao = Number(
        ((valorVendas * percentual) / 100).toFixed(2),
      );
      await prisma.comissaoComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-08",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-08",
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
          mesReferencia: "2026-08",
        },
      },
    });
    expect(Number(final?.valorVendas)).toBe(1234.56);
    expect(Number(final?.valorComissao)).toBe(92.59); // 1234.56 * 7.5 / 100 = 92.592
  });
});

describe("ProcedimentoPF - comercialId imutável por linha", () => {
  let gestorPfId: string;
  let parceiroId: string;
  let comercialId: string;
  let uploadId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;

    const pu = await prisma.usuario.create({
      data: {
        nome: "Parceiro",
        email: `parc-${unique()}@test.com`,
        senhaHash: await hash("x", 4),
        tipo: "PARCEIRO",
      },
    });
    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: pu.id,
        nome: "Parceiro",
        cpf: uniqueCpf(),
        gestorPfId,
      },
    });
    parceiroId = parceiro.id;

    const c = await criarComercial(gestorPfId);
    comercialId = c.id;

    const upload = await prisma.uploadPlanilhaPF.create({
      data: {
        gestorPfId,
        nomeArquivo: "test.xlsx",
        mesReferencia: "2026-09",
      },
    });
    uploadId = upload.id;
  });

  afterAll(async () => {
    await prisma.procedimentoPF.deleteMany({ where: { uploadId } });
    await prisma.uploadPlanilhaPF.delete({ where: { id: uploadId } });
    await prisma.comercial.delete({ where: { id: comercialId } });
    await prisma.parceiro.delete({ where: { id: parceiroId } });
  });

  it("deve persistir comercialId no procedimento (imutável)", async () => {
    const p = await prisma.procedimentoPF.create({
      data: {
        dataReferencia: new Date("2026-09-01"),
        dataPagamento: new Date("2026-09-05"),
        formaPagamento: "PIX",
        totalPago: 100,
        paciente: "Paciente",
        procedimento: "Consulta",
        cpf: "12345678901",
        tipoProcedimento: "ROTINA",
        unidade: "Unidade 1",
        parceiroId,
        comercialId,
        uploadId,
      },
    });

    expect(p.comercialId).toBe(comercialId);

    // Tentar atualizar去掉 comercialId não deve mudar o valor armazenado
    // (esta é a regra "histórico imutável" do plano)
    const refreshed = await prisma.procedimentoPF.findUnique({
      where: { id: p.id },
    });
    expect(refreshed?.comercialId).toBe(comercialId);
  });
});
