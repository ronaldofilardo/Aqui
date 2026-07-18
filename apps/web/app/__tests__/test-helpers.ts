/**
 * Helper compartilhado para cleanup seguro em testes
 * Respeita as constraints RESTRICT usando soft deletes
 */
import { prisma } from "@asa/database";

/**
 * Inativa todos os registros de teste criados durante o teste
 * Usa soft delete para respeitar constraints RESTRICT
 */
export async function safeCleanup() {
  // Soft delete em massa - inativa todos os registros
  // Isso respeita as constraints RESTRICT pois não deleta registros pais
  await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
}

/**
 * Cria dados de teste com CPFs únicos para evitar conflitos
 */
let _cpfSeq = 0;
export function uniqueCpf(): string {
  _cpfSeq++;
  const ts = Date.now().toString().slice(-6);
  const seq = (_cpfSeq % 1000).toString().padStart(3, "0");
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${ts}${seq}${rand}`.slice(0, 11).padStart(11, "0");
}

/**
 * Cria um backoffice de teste com dados únicos
 */
export async function createTestBackoffice() {
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Backoffice Teste",
      email: `backoffice-test-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.com`,
      senhaHash: "$2a$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR8yY1zX9vB2cC4dD6fF8gG0hH1i",
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    },
  });

  const backoffice = await prisma.backoffice.create({
    data: {
      usuarioId: usuario.id,
      nome: "Backoffice Teste",
      cpf: uniqueCpf(),
    },
  });

  return { usuario, backoffice };
}

/**
 * Cria uma liderança de teste vinculada a um backoffice
 */
export async function createTestLideranca(backofficeId: string) {
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Lideranca Teste",
      email: `lideranca-test-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.com`,
      senhaHash: "$2a$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR8yY1zX9vB2cC4dD6fF8gG0hH1i",
      tipo: "LIDERANCA",
    },
  });

  const lideranca = await prisma.lideranca.create({
    data: {
      usuarioId: usuario.id,
      nome: "Lideranca Teste",
      cpf: uniqueCpf(),
      backofficeId,
      tipo: "COMERCIAL",
    },
  });

  return { usuario, lideranca };
}

/**
 * Cria um comercial de teste vinculado a uma liderança
 */
export async function createTestComercial(liderancaId: string) {
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Comercial Teste",
      email: `comercial-test-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.com`,
      senhaHash: "$2a$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR8yY1zX9vB2cC4dD6fF8gG0hH1i",
      tipo: "COMERCIAL",
    },
  });

  const comercial = await prisma.comercial.create({
    data: {
      usuarioId: usuario.id,
      liderancaId,
      nome: "Comercial Teste",
      cpf: uniqueCpf(),
      percentualComissao: 5.0,
    },
  });

  return { usuario, comercial };
}
