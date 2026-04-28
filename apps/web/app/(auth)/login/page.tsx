"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const router = useRouter();

  function validateForm(): boolean {
    let isValid = true;
    setEmailError("");
    setSenhaError("");

    if (!email.trim()) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Email inválido");
      isValid = false;
    }

    if (!senha.trim()) {
      setSenhaError("Senha é obrigatória");
      isValid = false;
    } else if (senha.length < 6) {
      setSenhaError("Senha deve ter no mínimo 6 caracteres");
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErro("");

    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha inválidos. Tente novamente.");
      setLoading(false);
      return;
    }

    // Fetch session to determine redirect
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const tipo = session?.user?.tipo;

    if (tipo === "GESTOR") {
      router.push("/gestor/dashboard");
    } else if (tipo === "ESTABELECIMENTO") {
      router.push("/estabelecimento/dashboard");
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
              <div className="status-error p-4">
                <h3 className="font-semibold text-red-900 text-sm mb-1">
                  Erro ao fazer login
                </h3>
                <p className="text-red-800 text-sm">{erro}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white ${
                  emailError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primary-200"
                } disabled:bg-gray-50 disabled:text-gray-500`}
                placeholder="seu@email.com"
              />
              {emailError && (
                <p className="text-red-600 text-xs mt-1.5">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setSenhaError("");
                }}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white ${
                  senhaError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primary-200"
                } disabled:bg-gray-50 disabled:text-gray-500`}
                placeholder="••••••••"
              />
              {senhaError && (
                <p className="text-red-600 text-xs mt-1.5">{senhaError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-700 active:scale-95 transition-smooth focus-ring disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
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
