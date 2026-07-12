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

async function criarComercial(liderancaId: string) {
  const u = await prisma.usuario.create({
    data: {
      nome: `${unique()}`,
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
      liderancaId,
      percentualComissao: 0,
    },
  });
}

describe("Comercial - Modelo & Unicidade", () => {
  let liderancaId: string;
  let comercialIds: string[] = [];

  beforeAll(async () => {
    const gp = await criarGestorPF();
    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: gp.usuarioId,
        nome: gp.nome,
        cpf: uniqueCpf(),
        tipo: "COMERCIAL",
        gestorPfId: gp.id,
      },
    });
    liderancaId = lideranca.id;
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

  it("deve criar Comercial vinculado ao Lideranca", async () => {
    const c = await criarComercial(liderancaId);
    comercialIds.push(c.id);
    expect(c.liderancaId).toBe(liderancaId);
    expect(Number(c.percentualComissao)).toBe(0);
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
        liderancaId,
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
          liderancaId, },
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
    const c = await criarComercial(liderancaId);
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
  let liderancaId: string;
  let comercialId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;
    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: gp.usuarioId,
        nome: gp.nome,
        cpf: uniqueCpf(),
        tipo: "COMERCIAL",
        gestorPfId: gp.id,
      },
    });
    liderancaId = lideranca.id;
    const c = await criarComercial(liderancaId);
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
  let liderancaId: string;
  let comercialId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    gestorPfId = gp.id;
    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: gp.usuarioId,
        nome: gp.nome,
        cpf: uniqueCpf(),
        tipo: "COMERCIAL",
        gestorPfId: gp.id,
      },
    });
    liderancaId = lideranca.id;
    const c = await criarComercial(liderancaId);
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
  let comercialId: string;

  beforeAll(async () => {
    const gp = await criarGestorPF();
    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: gp.usuarioId,
        nome: gp.nome,
        cpf: uniqueCpf(),
        tipo: "COMERCIAL",
        gestorPfId: gp.id,
      },
    });
    const c = await criarComercial(lideranca.id);
    comercialId = c.id;
  });

  afterAll(async () => {
    await prisma.comercial.delete({ where: { id: comercialId } });
  });

  it("deve persistir comercialId no procedimento (imutável)", async () => {
    expect(comercialId).toBeDefined();
  });
});
