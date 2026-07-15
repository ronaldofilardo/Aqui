import { describe, it, expect } from "vitest";

/**
 * Testes de roteamento por papel no middleware.
 *
 * Cobre:
 * 1. Regras de acesso por prefixo (ROUTE_RULES)
 * 2. Redirecionamento pós-login por papel (dashboardForPapel)
 * 3. Autorização por papel (authorizeByPapel)
 */

// ---------------------------------------------------------------------------
// Replicação dos tipos e constantes do middleware.ts
// ---------------------------------------------------------------------------

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

function dashboardForPapel(user: SessionUser): string {
  if (user.tipo === "ADMIN") return "/admin/usuarios";
  if (user.tipo === "BACKOFFICE") return "/backoffice/dashboard";
  if (user.tipo === "GESTOR" && user.papel === "BACKOFFICE") {
    return "/backoffice/dashboard";
  }
  if (user.tipo === "GESTOR" && user.papel === "GESTOR_PF") {
    return "/gestor-pf/dashboard";
  }
  if (user.tipo === "GESTOR") return "/gestor/dashboard";
  if (user.tipo === "GESTOR_PF") return "/gestor-pf/dashboard";
  if (user.tipo === "PARCEIRO") return "/parceiro/indicados";
  if (user.tipo === "ESTABELECIMENTO") return "/estabelecimento/dashboard";
  if (user.tipo === "CONSULTOR") return "/consultor/estabelecimentos";
  return "/login";
}

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
    redirectTo: dashboardForPapel(user),
  };
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("Middleware — ROUTE_RULES", () => {
  it("deve conter regras para todos os perfis", () => {
    const prefixes = ROUTE_RULES.map((r) => r.prefix);
    expect(prefixes).toContain("/admin");
    expect(prefixes).toContain("/backoffice");
    expect(prefixes).toContain("/gestor-pf");
    expect(prefixes).toContain("/gestor");
    expect(prefixes).toContain("/parceiro");
    expect(prefixes).toContain("/consultor");
    expect(prefixes).toContain("/estabelecimento");
  });

  it("deve ter 7 regras de rota", () => {
    expect(ROUTE_RULES).toHaveLength(7);
  });

  it("/backoffice deve restringir a BACKOFFICE (tipo ou GESTOR com papel BACKOFFICE)", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/backoffice");
    expect(rule?.allowedTipos).toEqual(["BACKOFFICE", "GESTOR"]);
    expect(rule?.allowedPapeis).toEqual(["BACKOFFICE"]);
  });

  it("/gestor-pf deve restringir a BACKOFFICE (compatibilidade)", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/gestor-pf");
    expect(rule?.allowedTipos).toEqual(["BACKOFFICE", "GESTOR"]);
    expect(rule?.allowedPapeis).toEqual(["BACKOFFICE"]);
  });

  it("/gestor deve restringir a GESTOR_PJ", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/gestor");
    expect(rule?.allowedTipos).toEqual(["GESTOR"]);
    expect(rule?.allowedPapeis).toEqual(["GESTOR_PJ"]);
  });

  it("/admin deve permitir apenas ADMIN", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/admin");
    expect(rule?.allowedTipos).toEqual(["ADMIN"]);
    expect(rule?.allowedPapeis).toBeUndefined();
  });
});

describe("Middleware — dashboardForPapel", () => {
  it("deve redirecionar ADMIN para /admin/usuarios", () => {
    expect(dashboardForPapel({ tipo: "ADMIN", papel: null })).toBe(
      "/admin/usuarios",
    );
  });

  it("deve redirecionar BACKOFFICE para /backoffice/dashboard", () => {
    expect(dashboardForPapel({ tipo: "BACKOFFICE", papel: null })).toBe(
      "/backoffice/dashboard",
    );
  });

  it("deve redirecionar GESTOR com papel BACKOFFICE para /backoffice/dashboard", () => {
    expect(
      dashboardForPapel({ tipo: "GESTOR", papel: "BACKOFFICE" }),
    ).toBe("/backoffice/dashboard");
  });

  it("deve redirecionar GESTOR com papel GESTOR_PF para /gestor-pf/dashboard", () => {
    expect(
      dashboardForPapel({ tipo: "GESTOR", papel: "GESTOR_PF" }),
    ).toBe("/gestor-pf/dashboard");
  });

  it("deve redirecionar GESTOR_PJ para /gestor/dashboard", () => {
    expect(
      dashboardForPapel({ tipo: "GESTOR", papel: "GESTOR_PJ" }),
    ).toBe("/gestor/dashboard");
  });

  it("deve redirecionar GESTOR sem papel para /gestor/dashboard (fallback PJ)", () => {
    expect(dashboardForPapel({ tipo: "GESTOR", papel: null })).toBe(
      "/gestor/dashboard",
    );
  });

  it("deve redirecionar GESTOR_PF (tipo standalone) para /gestor-pf/dashboard", () => {
    expect(dashboardForPapel({ tipo: "GESTOR_PF", papel: null })).toBe(
      "/gestor-pf/dashboard",
    );
  });

  it("deve redirecionar PARCEIRO para /parceiro/indicados", () => {
    expect(dashboardForPapel({ tipo: "PARCEIRO", papel: null })).toBe(
      "/parceiro/indicados",
    );
  });

  it("deve redirecionar ESTABELECIMENTO para /estabelecimento/dashboard", () => {
    expect(dashboardForPapel({ tipo: "ESTABELECIMENTO", papel: null })).toBe(
      "/estabelecimento/dashboard",
    );
  });

  it("deve redirecionar CONSULTOR para /consultor/estabelecimentos", () => {
    expect(dashboardForPapel({ tipo: "CONSULTOR", papel: null })).toBe(
      "/consultor/estabelecimentos",
    );
  });

  it("deve redirecionar usuário sem tipo para /login", () => {
    expect(dashboardForPapel({ tipo: undefined, papel: null })).toBe("/login");
  });
});

describe("Middleware — authorizeByPapel BACKOFFICE", () => {
  it("deve autorizar BACKOFFICE (tipo) em /backoffice/dashboard", () => {
    const result = authorizeByPapel("/backoffice/dashboard", {
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve autorizar GESTOR com papel BACKOFFICE em /backoffice/dashboard", () => {
    const result = authorizeByPapel("/backoffice/dashboard", {
      tipo: "GESTOR",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve autorizar BACKOFFICE em /gestor-pf/dashboard (compatibilidade)", () => {
    const result = authorizeByPapel("/gestor-pf/dashboard", {
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve autorizar GESTOR com papel BACKOFFICE em /gestor-pf/dashboard", () => {
    const result = authorizeByPapel("/gestor-pf/dashboard", {
      tipo: "GESTOR",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar GESTOR_PJ em /backoffice/dashboard e redirecionar para /gestor/dashboard", () => {
    const result = authorizeByPapel("/backoffice/dashboard", {
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor/dashboard");
  });

  it("deve negar GESTOR_PJ em /gestor-pf/dashboard e redirecionar para /gestor/dashboard", () => {
    const result = authorizeByPapel("/gestor-pf/dashboard", {
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor/dashboard");
  });
});

describe("Middleware — authorizeByPapel", () => {
  it("deve autorizar BACKOFFICE em /gestor-pf/dashboard", () => {
    const result = authorizeByPapel("/gestor-pf/dashboard", {
      tipo: "GESTOR",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar GESTOR_PJ em /gestor-pf/dashboard e redirecionar para /gestor/dashboard", () => {
    const result = authorizeByPapel("/gestor-pf/dashboard", {
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor/dashboard");
  });

  it("deve autorizar GESTOR_PJ em /gestor/dashboard", () => {
    const result = authorizeByPapel("/gestor/dashboard", {
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar BACKOFFICE em /gestor/dashboard e redirecionar para /backoffice/dashboard", () => {
    const result = authorizeByPapel("/gestor/dashboard", {
      tipo: "GESTOR",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/backoffice/dashboard");
  });

  it("deve autorizar ADMIN em /admin/usuarios", () => {
    const result = authorizeByPapel("/admin/usuarios", {
      tipo: "ADMIN",
      papel: null,
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar GESTOR em /admin/usuarios", () => {
    const result = authorizeByPapel("/admin/usuarios", {
      tipo: "GESTOR",
      papel: "GESTOR_PF",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor-pf/dashboard");
  });

  it("deve autorizar PARCEIRO em /parceiro/indicados", () => {
    const result = authorizeByPapel("/parceiro/indicados", {
      tipo: "PARCEIRO",
      papel: null,
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve autorizar CONSULTOR em /consultor/estabelecimentos", () => {
    const result = authorizeByPapel("/consultor/estabelecimentos", {
      tipo: "CONSULTOR",
      papel: null,
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve autorizar ESTABELECIMENTO em /estabelecimento/dashboard", () => {
    const result = authorizeByPapel("/estabelecimento/dashboard", {
      tipo: "ESTABELECIMENTO",
      papel: null,
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve permitir rotas fora das regras (ex: /public)", () => {
    const result = authorizeByPapel("/public/landing", {
      tipo: undefined,
      papel: null,
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve redirecionar GESTOR_PF com erro para dashboard PF quando acessar rota PJ", () => {
    const result = authorizeByPapel("/gestor/consultores", {
      tipo: "GESTOR",
      papel: "GESTOR_PF",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor-pf/dashboard");
  });

  it("deve redirecionar GESTOR_PJ com erro para dashboard PJ quando acessar rota PF", () => {
    const result = authorizeByPapel("/gestor-pf/parceiros", {
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor/dashboard");
  });
});
