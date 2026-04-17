"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha inválidos");
      setLoading(false);
      return;
    }

    // Fetch session to determine redirect
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const tipo = session?.user?.tipo;

    if (tipo === "GESTOR") {
      router.push("/gestor/dashboard");
    } else {
      router.push("/consultor/estabelecimentos");
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Painel lateral laranja */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow">
            <span className="text-primary-600 font-black text-sm">AS</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">Acesso Saúde</span>
            <span className="text-primary-200 text-sm ml-1">Aqui</span>
          </div>
        </div>

        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Satisfação em acolher
            <br />e cuidar de você.
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Plataforma de gestão de cupons,
            <br />
            consultas e comissões da rede Acesso Saúde.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <div className="w-2 h-2 rounded-full bg-primary-300"></div>
          <div className="w-2 h-2 rounded-full bg-primary-300"></div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-black text-sm">AS</span>
            </div>
            <div>
              <span className="text-primary-600 font-bold text-lg">
                Acesso Saúde
              </span>
              <span className="text-gray-400 text-sm ml-1">Aqui</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-500 mb-8">
            Entre com suas credenciais para acessar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span>⚠️</span> {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm transition bg-white"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm transition bg-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-700 active:bg-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Acesso Saúde Aqui © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
