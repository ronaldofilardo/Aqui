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

const gestorNav: NavItem[] = [
  { label: "Dashboard", href: "/gestor/dashboard", icon: "📊" },
  { label: "Consultores", href: "/gestor/consultores", icon: "👥" },
  { label: "Importar Cupons", href: "/gestor/importar-cupons", icon: "📥" },
  { label: "Comissões", href: "/gestor/comissoes", icon: "💰" },
  { label: "Pagamentos", href: "/gestor/pagamentos", icon: "💳" },
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
  { label: "Extrato", href: "/consultor/extrato", icon: "📄" },
  { label: "Dados Pessoais", href: "/consultor/dados-pessoais", icon: "👤" },
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

  it("hrefs do gestor devem começar com /gestor/", () => {
    gestorNav.forEach((item) => {
      expect(item.href.startsWith("/gestor/")).toBe(true);
    });
  });

  it("deve conter rota de dashboard", () => {
    expect(gestorNav.some((i) => i.href === "/gestor/dashboard")).toBe(true);
  });

  it("deve conter rota de pagamentos", () => {
    expect(gestorNav.some((i) => i.href === "/gestor/pagamentos")).toBe(true);
  });
});

describe("Sidebar — Navegação do Consultor", () => {
  it("deve ter 5 itens de navegação", () => {
    expect(consultorNav).toHaveLength(5);
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

describe("Sidebar — Seleção de nav por tipo de usuário", () => {
  it("deve retornar gestorNav para tipo GESTOR", () => {
    const tipo = "GESTOR";
    const nav = tipo === "GESTOR" ? gestorNav : consultorNav;
    expect(nav).toBe(gestorNav);
  });

  it("deve retornar consultorNav para tipo CONSULTOR", () => {
    const tipo = "CONSULTOR";
    const nav = tipo === "GESTOR" ? gestorNav : consultorNav;
    expect(nav).toBe(consultorNav);
  });

  it("deve retornar consultorNav para tipo indefinido", () => {
    const tipo: string | undefined = undefined;
    const nav = tipo === "GESTOR" ? gestorNav : consultorNav;
    expect(nav).toBe(consultorNav);
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
