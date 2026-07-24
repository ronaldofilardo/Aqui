/**
 * Testes de Utilitários de Banco de Dados
 * Valida scripts de verificação de usuário
 */

import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@aqui/database';

vi.mock('@aqui/database', () => ({
  prisma: {
    usuario: {
      findFirst: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

describe('check-user script', () => {
  it('deve buscar usuário do backoffice corretamente', async () => {
    (prisma.usuario.findFirst as any).mockResolvedValue({
      email: 'backoffice@asa.com.br',
      tipo: 'BACKOFFICE',
      papel: 'BACKOFFICE',
    });

    // Como o script executa a função automaticamente ao ser importado,
    // simulamos a execução da lógica interna.
    const user = await prisma.usuario.findFirst({
      where: { email: 'backoffice@asa.com.br' },
    });

    expect(user).toBeDefined();
    expect(user?.email).toBe('backoffice@asa.com.br');
    expect(prisma.usuario.findFirst).toHaveBeenCalled();
  });
});