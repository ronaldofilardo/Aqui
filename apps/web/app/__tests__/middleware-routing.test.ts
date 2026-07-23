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
    allowedTipos: ["BACKOFFICE"],
    allowedPapeis: ["BACKOFFICE"],
  },
  {
    prefix: "/gestor",
    allowedTipos: ["GERENCIA"],
    allowedPapeis: ["GESTOR_PJ"],
  },
  { prefix: "/parceiro", allowedTipos: ["PARCEIRO"] },
  { prefix: "/comercial", allowedTipos: ["COMERCIAL"] },
  { prefix: "/consultor", allowedTipos: ["CONSULTOR"] },
  {
    prefix: "/estabelecimento",
    allowedTipos: ["ESTABELECIMENTO"],
  },
  { prefix: "/lideranca", allowedTipos: ["LIDERANCA"] },
];

function dashboardForPapel(user: SessionUser): string {
  if (user.tipo === "ADMIN") return "/admin/usuarios";
  if (user.tipo === "BACKOFFICE" && user.papel === "BACKOFFICE") {
    return "/backoffice/dashboard";
  }
  if (user.tipo === "GERENCIA") return "/gestor/dashboard";
  if (user.tipo === "PARCEIRO") return "/parceiro/indicados";
  if (user.tipo === "COMERCIAL") return "/comercial/minha-comissao";
  if (user.tipo === "ESTABELECIMENTO") return "/estabelecimento/dashboard";
  if (user.tipo === "CONSULTOR") return "/consultor/estabelecimentos";
  if (user.tipo === "LIDERANCA") return "/lideranca";
  if (user.tipo === "BACKOFFICE") return "/backoffice/dashboard";
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
    expect(prefixes).toContain("/gestor");
    expect(prefixes).toContain("/parceiro");
    expect(prefixes).toContain("/comercial");
    expect(prefixes).toContain("/consultor");
    expect(prefixes).toContain("/estabelecimento");
    expect(prefixes).toContain("/lideranca");
  });

  it("deve ter 8 regras de rota", () => {
    expect(ROUTE_RULES).toHaveLength(8);
  });

  it("/backoffice deve restringir a BACKOFFICE", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/backoffice");
    expect(rule?.allowedTipos).toEqual(["BACKOFFICE"]);
    expect(rule?.allowedPapeis).toEqual(["BACKOFFICE"]);
  });

  it("/gestor deve restringir a GERENCIA + GESTOR_PJ", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/gestor");
    expect(rule?.allowedTipos).toEqual(["GERENCIA"]);
    expect(rule?.allowedPapeis).toEqual(["GESTOR_PJ"]);
  });

  it("/comercial deve restringir a COMERCIAL", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/comercial");
    expect(rule?.allowedTipos).toEqual(["COMERCIAL"]);
    expect(rule?.allowedPapeis).toBeUndefined();
  });

  it("/admin deve permitir apenas ADMIN", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/admin");
    expect(rule?.allowedTipos).toEqual(["ADMIN"]);
    expect(rule?.allowedPapeis).toBeUndefined();
  });

  it("/lideranca deve restringir a LIDERANCA", () => {
    const rule = ROUTE_RULES.find((r) => r.prefix === "/lideranca");
    expect(rule?.allowedTipos).toEqual(["LIDERANCA"]);
    expect(rule?.allowedPapeis).toBeUndefined();
  });
});

describe("Middleware — dashboardForPapel", () => {
  it("deve redirecionar ADMIN para /admin/usuarios", () => {
    expect(dashboardForPapel({ tipo: "ADMIN", papel: null })).toBe(
      "/admin/usuarios",
    );
  });

  it("deve redirecionar BACKOFFICE (com papel BACKOFFICE) para /backoffice/dashboard", () => {
    expect(dashboardForPapel({ tipo: "BACKOFFICE", papel: "BACKOFFICE" })).toBe(
      "/backoffice/dashboard",
    );
  });

  it("deve redirecionar BACKOFFICE (sem papel) para /backoffice/dashboard", () => {
    expect(dashboardForPapel({ tipo: "BACKOFFICE", papel: null })).toBe(
      "/backoffice/dashboard",
    );
  });

  it("deve redirecionar GERENCIA para /gestor/dashboard", () => {
    expect(
      dashboardForPapel({ tipo: "GERENCIA", papel: "GESTOR_PJ" }),
    ).toBe("/gestor/dashboard");
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

  it("deve redirecionar LIDERANCA para /lideranca", () => {
    expect(dashboardForPapel({ tipo: "LIDERANCA", papel: null })).toBe("/lideranca");
  });

  it("deve redirecionar usuário sem tipo para /login", () => {
    expect(dashboardForPapel({ tipo: undefined, papel: null })).toBe("/login");
  });
});

describe("Middleware — authorizeByPapel BACKOFFICE", () => {
  it("deve autorizar BACKOFFICE (com papel) em /backoffice/dashboard", () => {
    const result = authorizeByPapel("/backoffice/dashboard", {
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar CONSULTOR em /backoffice/dashboard", () => {
    const result = authorizeByPapel("/backoffice/dashboard", {
      tipo: "CONSULTOR",
      papel: null,
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/consultor/estabelecimentos");
  });
});

describe("Middleware — authorizeByPapel", () => {
  it("deve autorizar BACKOFFICE em /backoffice/dashboard", () => {
    const result = authorizeByPapel("/backoffice/dashboard", {
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve autorizar GERENCIA em /gestor/dashboard", () => {
    const result = authorizeByPapel("/gestor/dashboard", {
      tipo: "GERENCIA",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar BACKOFFICE em /gestor/dashboard e redirecionar para /backoffice/dashboard", () => {
    const result = authorizeByPapel("/gestor/dashboard", {
      tipo: "BACKOFFICE",
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

  it("deve negar CONSULTOR em /admin/usuarios", () => {
    const result = authorizeByPapel("/admin/usuarios", {
      tipo: "CONSULTOR",
      papel: null,
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/consultor/estabelecimentos");
  });

  it("deve negar GERENCIA em /admin/usuarios", () => {
    const result = authorizeByPapel("/admin/usuarios", {
      tipo: "GERENCIA",
      papel: "GESTOR_PJ",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/gestor/dashboard");
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

  it("deve autorizar LIDERANCA em /lideranca", () => {
    const result = authorizeByPapel("/lideranca", {
      tipo: "LIDERANCA",
      papel: null,
    });
    expect(result.authorized).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("deve negar BACKOFFICE em /lideranca e redirecionar para /backoffice/dashboard", () => {
    const result = authorizeByPapel("/lideranca", {
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    });
    expect(result.authorized).toBe(false);
    expect(result.redirectTo).toBe("/backoffice/dashboard");
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
});
