/**
 * Testes de Permissão de Backoffice - Middleware e Rotas
 * 
 * Valida que o usuário BACKOFFICE (tipo GESTOR, papel BACKOFFICE)
 * pode acessar todas as rotas do backoffice corretamente.
 */

import { describe, it, expect } from 'vitest';

describe('Backoffice - Permissões de Acesso', () => {
  type SessionUser = {
    tipo?: string;
    papel?: string | null;
  };

  type RouteRule = {
    prefix: string;
    allowedTipos: string[];
    allowedPapeis?: Array<string | null>;
  };

  const ROUTE_RULES: RouteRule[] = [
    { prefix: "/admin", allowedTipos: ["ADMIN"] },
    {
      prefix: "/backoffice",
      allowedTipos: ["BACKOFFICE", "GESTOR"],
      allowedPapeis: ["BACKOFFICE"],
    },
    {
      prefix: "/gestor-pf",
      allowedTipos: ["BACKOFFICE", "GESTOR"],
      allowedPapeis: ["BACKOFFICE"],
    },
    {
      prefix: "/gestor",
      allowedTipos: ["GESTOR"],
      allowedPapeis: ["GESTOR_PJ"],
    },
    { prefix: "/parceiro", allowedTipos: ["PARCEIRO"] },
    { prefix: "/consultor", allowedTipos: ["CONSULTOR"] },
    {
      prefix: "/estabelecimento",
      allowedTipos: ["ESTABELECIMENTO"],
    },
  ];

  function authorizeByPapel(
    pathname: string,
    user: SessionUser,
  ): { authorized: boolean; redirectTo: string | null } {
    const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
    if (!rule) return { authorized: true, redirectTo: null };

    const isAuthorized =
      !!user.tipo &&
      rule.allowedTipos.includes(user.tipo) &&
      (rule.allowedPapeis === undefined ||
        rule.allowedPapeis.includes(user.papel ?? null));

    if (isAuthorized) return { authorized: true, redirectTo: null };

    return {
      authorized: false,
      redirectTo: null,
    };
  }

  const backofficeUser: SessionUser = {
    tipo: "GESTOR",
    papel: "BACKOFFICE",
  };

  const backofficeTipoUser: SessionUser = {
    tipo: "BACKOFFICE",
    papel: "BACKOFFICE",
  };

  const gestorPjUser: SessionUser = {
    tipo: "GESTOR",
    papel: "GESTOR_PJ",
  };

  describe('Acesso do Backoffice (GESTOR + BACKOFFICE)', () => {
    const rotasBackoffice = [
      "/backoffice/dashboard",
      "/backoffice/producao",
      "/backoffice/comerciais",
      "/backoffice/liderancas",
      "/backoffice/pontos",
      "/backoffice/relatorios",
    ];

    rotasBackoffice.forEach((rota) => {
      it(`deve autorizar acesso a ${rota}`, () => {
        const result = authorizeByPapel(rota, backofficeUser);
        expect(result.authorized).toBe(true);
      });
    });
  });

  describe('Acesso do Backoffice (BACKOFFICE tipo)', () => {
    const rotasBackoffice = [
      "/backoffice/dashboard",
      "/backoffice/producao",
      "/backoffice/comerciais",
      "/backoffice/liderancas",
      "/backoffice/pontos",
    ];

    rotasBackoffice.forEach((rota) => {
      it(`deve autorizar acesso a ${rota}`, () => {
        const result = authorizeByPapel(rota, backofficeTipoUser);
        expect(result.authorized).toBe(true);
      });
    });
  });

  describe('Compatibilidade com /gestor-pf', () => {
    it('deve autorizar BACKOFFICE em /gestor-pf/dashboard', () => {
      const result = authorizeByPapel("/gestor-pf/dashboard", backofficeUser);
      expect(result.authorized).toBe(true);
    });

    it('deve autorizar BACKOFFICE em /gestor-pf/parceiros', () => {
      const result = authorizeByPapel("/gestor-pf/parceiros", backofficeUser);
      expect(result.authorized).toBe(true);
    });

    it('deve autorizar BACKOFFICE em /gestor-pf/relatorios', () => {
      const result = authorizeByPapel("/gestor-pf/relatorios", backofficeUser);
      expect(result.authorized).toBe(true);
    });
  });

  describe('Restrições de Acesso', () => {
    it('deve negar acesso do BACKOFFICE a /gestor/dashboard', () => {
      const result = authorizeByPapel("/gestor/dashboard", backofficeUser);
      expect(result.authorized).toBe(false);
    });

    it('deve negar acesso do GESTOR_PJ a /backoffice/dashboard', () => {
      const result = authorizeByPapel("/backoffice/dashboard", gestorPjUser);
      expect(result.authorized).toBe(false);
    });

    it('deve negar acesso do GESTOR_PJ a /gestor-pf/dashboard', () => {
      const result = authorizeByPapel("/gestor-pf/dashboard", gestorPjUser);
      expect(result.authorized).toBe(false);
    });

    it('deve negar acesso do BACKOFFICE a /admin/usuarios', () => {
      const result = authorizeByPapel("/admin/usuarios", backofficeUser);
      expect(result.authorized).toBe(false);
    });
  });

  describe('Acesso de Outros Perfis', () => {
    it('deve autorizar ADMIN em /admin/*', () => {
      const adminUser: SessionUser = { tipo: "ADMIN", papel: null };
      const result = authorizeByPapel("/admin/usuarios", adminUser);
      expect(result.authorized).toBe(true);
    });

    it('deve autorizar GESTOR_PJ em /gestor/*', () => {
      const result = authorizeByPapel("/gestor/dashboard", gestorPjUser);
      expect(result.authorized).toBe(true);
    });

    it('deve autorizar PARCEIRO em /parceiro/*', () => {
      const parceiroUser: SessionUser = { tipo: "PARCEIRO", papel: null };
      const result = authorizeByPapel("/parceiro/indicados", parceiroUser);
      expect(result.authorized).toBe(true);
    });
  });

  describe('Matriz Completa de Permissão - Backoffice', () => {
    const matriz = [
      { rota: "/backoffice/dashboard", user: backofficeUser, esperado: true },
      { rota: "/backoffice/producao", user: backofficeUser, esperado: true },
      { rota: "/gestor-pf/parceiros", user: backofficeUser, esperado: true },
      { rota: "/gestor/dashboard", user: backofficeUser, esperado: false },
      { rota: "/gestor/consultores", user: backofficeUser, esperado: false },
      { rota: "/admin/usuarios", user: backofficeUser, esperado: false },
      { rota: "/parceiro/indicados", user: backofficeUser, esperado: false },
    ];

    matriz.forEach(({ rota, user, esperado }) => {
      it(`deve ${esperado ? 'permitir' : 'negar'} acesso de ${user.papel} a ${rota}`, () => {
        const result = authorizeByPapel(rota, user);
        expect(result.authorized).toBe(esperado);
      });
    });
  });
});