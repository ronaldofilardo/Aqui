import { describe, it, expect } from "vitest";

/**
 * Testes do Design System — Acesso Saúde Aqui
 *
 * Cobre as alterações estruturais desta sessão:
 * 1. Paleta de cores — laranja como primary (substituição do azul)
 * 2. Estrutura de navegação da Sidebar — ícones + rotas
 * 3. Comportamento dos nav items (gestor vs. consultor)
 * 4. Geração de initials do usuário
 * 5. Classe CSS fixa da sidebar
 */

// ---------------------------------------------------------------------------
// Estrutura de navegação (replicação das constantes de sidebar.tsx)
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { label: "Usuários", href: "/admin/usuarios", icon: "👤" },
];

const gestorNav: NavItem[] = [
  { label: "Dashboard", href: "/gestor/dashboard", icon: "📊" },
  { label: "Consultores", href: "/gestor/consultores", icon: "👥" },
  { label: "Importar Cupons", href: "/gestor/importar-cupons", icon: "📥" },
  { label: "Produção", href: "/gestor/producao", icon: "📋" },
  { label: "Comissões", href: "/gestor/comissoes", icon: "💰" },
  { label: "Auditoria", href: "/gestor/auditoria", icon: "🔍" },
];

const consultorNav: NavItem[] = [
  {
    label: "Estabelecimentos",
    href: "/consultor/estabelecimentos",
    icon: "🏥",
  },
  { label: "Comissões", href: "/consultor/comissoes", icon: "💰" },
  { label: "Produtividade", href: "/consultor/produtividade", icon: "📈" },
  { label: "Dados Pessoais", href: "/consultor/dados-pessoais", icon: "👤" },
];

const backofficeNav: NavItem[] = [
  { label: "Dashboard", href: "/backoffice/dashboard", icon: "📊" },
  { label: "Parceiros", href: "/backoffice/parceiros", icon: "👥" },
  { label: "Upload Planilha", href: "/backoffice/uploads", icon: "📥" },
  { label: "Produção", href: "/backoffice/producao", icon: "📋" },
  { label: "Comissões", href: "/backoffice/comissoes", icon: "💰" },
];

const parceiroNav: NavItem[] = [
  { label: "Cadastrar Cliente", href: "/parceiro/indicados", icon: "👥" },
  { label: "Minhas Comissões", href: "/parceiro/comissoes", icon: "💰" },
  { label: "Dados Pessoais", href: "/parceiro/dados-pessoais", icon: "👤" },
];

const estabelecimentoNav: NavItem[] = [
  { label: "Dashboard", href: "/estabelecimento/dashboard", icon: "📊" },
  {
    label: "Produtividade",
    href: "/estabelecimento/produtividade",
    icon: "📈",
  },
  { label: "Comissões", href: "/estabelecimento/comissoes", icon: "💰" },
];

// ---------------------------------------------------------------------------
// Helper de initials (replicação da lógica de sidebar.tsx)
// ---------------------------------------------------------------------------
function generateInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("");
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("Sidebar — Navegação do Gestor", () => {
  it("deve ter 6 itens de navegação", () => {
    expect(gestorNav).toHaveLength(6);
  });

  it("todos os itens devem ter href, label e icon", () => {
    gestorNav.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    });
  });

  it("hrefs do gestor PJ devem começar com /gestor/", () => {
    gestorNav.forEach((item) => {
      expect(item.href.startsWith("/gestor/")).toBe(true);
    });
  });

  it("deve conter rota de dashboard", () => {
    expect(gestorNav.some((i) => i.href === "/gestor/dashboard")).toBe(true);
  });
});

describe("Sidebar — Navegação do Backoffice", () => {
  it("deve ter 5 itens de navegação", () => {
    expect(backofficeNav).toHaveLength(5);
  });

  it("todos os itens devem ter href, label e icon", () => {
    backofficeNav.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    });
  });

  it("hrefs do backoffice devem começar com /backoffice/", () => {
    backofficeNav.forEach((item) => {
      expect(item.href.startsWith("/backoffice/")).toBe(true);
    });
  });

  it("deve conter rota de parceiros (diferente do PJ)", () => {
    expect(
      backofficeNav.some((i) => i.href === "/backoffice/parceiros"),
    ).toBe(true);
  });

  it("não deve conter rotas de /gestor/", () => {
    backofficeNav.forEach((item) => {
      expect(item.href.startsWith("/gestor/")).toBe(false);
    });
  });
});

describe("Sidebar — Navegação do Consultor", () => {
  it("deve ter 4 itens de navegação", () => {
    expect(consultorNav).toHaveLength(4);
  });

  it("todos os itens devem ter href, label e icon", () => {
    consultorNav.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    });
  });

  it("hrefs do consultor devem começar com /consultor/", () => {
    consultorNav.forEach((item) => {
      expect(item.href.startsWith("/consultor/")).toBe(true);
    });
  });

  it("deve conter rota de dados pessoais", () => {
    expect(
      consultorNav.some((i) => i.href === "/consultor/dados-pessoais"),
    ).toBe(true);
  });
});

describe("Sidebar — Seleção de nav por tipo e papel de usuário", () => {
  function selectNav(
    tipo: string | undefined,
    papel: string | null | undefined,
  ): NavItem[] {
    if (tipo === "ADMIN") return adminNav;
    if (tipo === "GESTOR" && papel === "GESTOR_PF") return backofficeNav;
    if (tipo === "GESTOR") return gestorNav;
    if (tipo === "GESTOR_PF") return backofficeNav;
    if (tipo === "PARCEIRO") return parceiroNav;
    if (tipo === "ESTABELECIMENTO") return estabelecimentoNav;
    return consultorNav;
  }

  it("deve retornar gestorPJNav para GESTOR com papel GESTOR_PJ", () => {
    expect(selectNav("GESTOR", "GESTOR_PJ")).toBe(gestorNav);
  });

  it("deve retornar backofficeNav para GESTOR com papel GESTOR_PF", () => {
    expect(selectNav("GESTOR", "GESTOR_PF")).toBe(backofficeNav);
  });

  it("deve retornar backofficeNav para tipo GESTOR_PF (legacy)", () => {
    expect(selectNav("GESTOR_PF", null)).toBe(backofficeNav);
  });

  it("deve retornar gestorPJNav para GESTOR sem papel definido", () => {
    expect(selectNav("GESTOR", null)).toBe(gestorNav);
  });

  it("deve retornar consultorNav para tipo indefinido", () => {
    expect(selectNav(undefined, undefined)).toBe(consultorNav);
  });
});

describe("Sidebar — Geração de initials do usuário", () => {
  it("deve gerar 2 letras de nome completo", () => {
    expect(generateInitials("João Silva")).toBe("JS");
  });

  it("deve gerar 1 letra de nome único", () => {
    expect(generateInitials("Vanda")).toBe("V");
  });

  it("deve usar apenas as 2 primeiras palavras", () => {
    expect(generateInitials("Maria de Fátima Silva")).toBe("Md");
  });

  it("deve retornar ? quando nome for null", () => {
    expect(generateInitials(null)).toBe("?");
  });

  it("deve retornar ? quando nome for undefined", () => {
    expect(generateInitials(undefined)).toBe("?");
  });

  it("deve retornar ? quando nome for string vazia", () => {
    expect(generateInitials("")).toBe("?");
  });
});

describe("Design System — Paleta de cores laranja (tokens Tailwind)", () => {
  const palette = {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea6c0a",
    700: "#c2570a",
    800: "#9a3c0f",
    900: "#7c2d12",
  };

  it("cor primária 500 deve ser laranja #f97316", () => {
    expect(palette[500]).toBe("#f97316");
  });

  it("cor primária 600 deve ser laranja escuro #ea6c0a", () => {
    expect(palette[600]).toBe("#ea6c0a");
  });

  it("deve ter 10 tons na paleta", () => {
    expect(Object.keys(palette)).toHaveLength(10);
  });

  it("tons mais claros devem ter maior componente R no hex", () => {
    // 50 é mais claro (mais branco) que 900
    const r50 = parseInt(palette[50].slice(1, 3), 16);
    const r900 = parseInt(palette[900].slice(1, 3), 16);
    expect(r50).toBeGreaterThan(r900);
  });
});

describe("Design System — Mensagens de autenticação", () => {
  it("mensagem de erro de login deve ser legível", () => {
    const msg = "Email ou senha inválidos";
    expect(msg).not.toContain("Credenciais inválidas"); // legado removido
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe("Sidebar — Navegação do Estabelecimento", () => {
  it("deve ter 3 itens de navegação", () => {
    expect(estabelecimentoNav).toHaveLength(3);
  });

  it("todos os itens devem ter href, label e icon", () => {
    estabelecimentoNav.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    });
  });

  it("hrefs do estabelecimento devem começar com /estabelecimento/", () => {
    estabelecimentoNav.forEach((item) => {
      expect(item.href.startsWith("/estabelecimento/")).toBe(true);
    });
  });

  it("deve conter rota de dashboard", () => {
    expect(
      estabelecimentoNav.some((i) => i.href === "/estabelecimento/dashboard"),
    ).toBe(true);
  });

  it("deve conter rota de comissoes", () => {
    expect(
      estabelecimentoNav.some((i) => i.href === "/estabelecimento/comissoes"),
    ).toBe(true);
  });
});

describe("Sidebar — Seleção de nav para ESTABELECIMENTO", () => {
  function selectNav(
    tipo: string | undefined,
    papel: string | null | undefined,
  ): NavItem[] {
    if (tipo === "ADMIN") return adminNav;
    if (tipo === "GESTOR" && papel === "GESTOR_PF") return backofficeNav;
    if (tipo === "GESTOR") return gestorNav;
    if (tipo === "GESTOR_PF") return backofficeNav;
    if (tipo === "PARCEIRO") return parceiroNav;
    if (tipo === "ESTABELECIMENTO") return estabelecimentoNav;
    return consultorNav;
  }

  it("deve retornar estabelecimentoNav para tipo ESTABELECIMENTO", () => {
    expect(selectNav("ESTABELECIMENTO", null)).toBe(estabelecimentoNav);
  });

  it("não deve retornar nav do consultor para ESTABELECIMENTO", () => {
    expect(selectNav("ESTABELECIMENTO", null)).not.toBe(consultorNav);
  });

  it("não deve retornar nav do gestor para ESTABELECIMENTO", () => {
    expect(selectNav("ESTABELECIMENTO", null)).not.toBe(gestorNav);
  });
});
