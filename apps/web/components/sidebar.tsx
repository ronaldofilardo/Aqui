"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  subItems?: { label: string; href: string }[];
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

const gestorpFNav: NavItem[] = [
  { label: "Dashboard", href: "/gestor-pf/dashboard", icon: "📊" },
  { 
    label: "Usuários", 
    href: "/gestor-pf/usuarios", 
    icon: "👥",
    subItems: [
      { label: "Comerciais", href: "/gestor-pf/usuarios/comerciais" },
    ]
  },
  { 
    label: "Produção", 
    href: "/gestor-pf/producao", 
    icon: "📋",
    subItems: [
      { label: "Upload Planilha", href: "/gestor-pf/producao/upload" },
      { label: "Procedimentos", href: "/gestor-pf/producao/procedimentos" },
    ]
  },
  { label: "Pontos", href: "/gestor-pf/pontos", icon: "🎯" },
  { 
    label: "Comissionamento", 
    href: "/gestor-pf/comissionamento", 
    icon: "💰",
    subItems: [
      { label: "Relatórios", href: "/gestor-pf/comissionamento/relatorios" },
      { label: "Pagamentos", href: "/gestor-pf/comissionamento/pagamentos" },
    ]
  },
  { 
    label: "Configurações", 
    href: "/gestor-pf/configuracoes", 
    icon: "⚙️",
    subItems: [
      { label: "Regras", href: "/gestor-pf/configuracoes/regras" },
      { label: "Comissões", href: "/gestor-pf/configuracoes/comissoes" },
    ]
  },
];

const parceiroNav: NavItem[] = [
  { label: "Cadastrar Cliente", href: "/parceiro/indicados", icon: "👥" },
  { label: "Dados Pessoais", href: "/parceiro/dados-pessoais", icon: "👤" },
];

const comercialNav: NavItem[] = [
  { label: "Minha Comissão", href: "/comercial/minha-comissao", icon: "💰" },
  { label: "Minhas Metas", href: "/comercial/minhas-metas", icon: "🎯" },
  { label: "Dados Pessoais", href: "/comercial/dados-pessoais", icon: "👤" },
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

function getTipoLabel(tipo: string | undefined) {
  if (tipo === "ADMIN") return "Administrador";
  if (tipo === "GESTOR") return "Gestor";
  if (tipo === "GESTOR_PF") return "Gestor PF";
  if (tipo === "PARCEIRO") return "Parceiro";
  if (tipo === "CONSULTOR") return "Consultor";
  if (tipo === "ESTABELECIMENTO") return "Estabelecimento";
  if (tipo === "COMERCIAL") return "Comercial";
  return "";
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tipo = (session?.user as any)?.tipo;
  const papel = (session?.user as any)?.papel;

  let navItems: NavItem[];
  if (tipo === "ADMIN") navItems = adminNav;
  else if (tipo === "GESTOR" && papel === "GESTOR_PF") navItems = gestorpFNav;
  else if (tipo === "GESTOR") navItems = gestorNav;
  else if (tipo === "GESTOR_PF") navItems = gestorpFNav;
  else if (tipo === "PARCEIRO") navItems = parceiroNav;
  else if (tipo === "COMERCIAL") navItems = comercialNav;
  else if (tipo === "ESTABELECIMENTO") navItems = estabelecimentoNav;
  else navItems = consultorNav;

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
    : "?";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary-600 flex flex-col shadow-xl overflow-y-auto z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-primary-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-primary-600 font-black text-sm leading-none">
              AS
            </span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">
              Acesso Saúde
            </h1>
            <p className="text-primary-200 text-xs">Aqui</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth focus-ring ${
                  active && !hasSubItems
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-white hover:bg-primary-500 hover:text-white hover:shadow-sm"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
              {hasSubItems && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {item.subItems!.map((subItem) => {
                    const subActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-3 py-2 rounded-lg text-xs font-medium transition-smooth ${
                          subActive
                            ? "bg-white text-primary-700 shadow-sm"
                            : "text-white hover:bg-primary-500 hover:text-white"
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-primary-500">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-700/50 mb-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 font-bold text-xs">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {session?.user?.name}
            </p>
            <p className="text-primary-200 text-xs truncate">
              {getTipoLabel(tipo)}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-primary-500 text-xs font-medium transition-all flex items-center gap-2"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  );
}
