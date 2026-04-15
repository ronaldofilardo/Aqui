"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
}

const gestorNav: NavItem[] = [
  { label: "Dashboard", href: "/gestor/dashboard" },
  { label: "Consultores", href: "/gestor/consultores" },
  { label: "Importar Cupons", href: "/gestor/importar-cupons" },
  { label: "Comissões", href: "/gestor/comissoes" },
  { label: "Pagamentos", href: "/gestor/pagamentos" },
  { label: "Auditoria", href: "/gestor/auditoria" },
];

const consultorNav: NavItem[] = [
  { label: "Estabelecimentos", href: "/consultor/estabelecimentos" },
  { label: "Comissões", href: "/consultor/comissoes" },
  { label: "Produtividade", href: "/consultor/produtividade" },
  { label: "Extrato", href: "/consultor/extrato" },
  { label: "Dados Pessoais", href: "/consultor/dados-pessoais" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tipo = session?.user?.tipo;
  const navItems = tipo === "GESTOR" ? gestorNav : consultorNav;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-700">ASA</h1>
        <p className="text-xs text-gray-500 mt-1">Acesso Saúde Aqui</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-2">
          {session?.user?.name}
          <span className="block text-xs text-gray-400">
            {session?.user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
