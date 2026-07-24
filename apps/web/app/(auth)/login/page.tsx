"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [showIndicarModal, setShowIndicarModal] = useState(false);
  const [indicarForm, setIndicarForm] = useState({
    cpfParceiro: "",
    cpfIndicado: "",
    nomeIndicado: "",
    telefoneIndicado: "",
  });
  const [indicarLoading, setIndicarLoading] = useState(false);
  const [indicadoCpfValidation, setIndicadoCpfValidation] = useState<
    "valid" | "invalid" | ""
  >("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
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

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const tipo = session?.user?.tipo;
    const papel = session?.user?.papel;

    console.log("[Login] Session:", session);
    console.log("[Login] Tipo:", tipo, "Papel:", papel);

    if (tipo === "ADMIN") {
      router.push("/admin/usuarios");
    } else if (tipo === "GESTOR" && papel === "BACKOFFICE") {
      router.push("/backoffice/dashboard");
    } else if (tipo === "GESTOR" && papel === "GESTOR_PJ") {
      router.push("/gestor/dashboard");
    } else if (tipo === "BACKOFFICE") {
      router.push("/backoffice/dashboard");
    } else if (tipo === "GESTOR_PJ") {
      router.push("/gestor/dashboard");
    } else if (tipo === "PARCEIRO") {
      router.push("/parceiro/indicados");
    } else if (tipo === "ESTABELECIMENTO") {
      router.push("/estabelecimento/dashboard");
    } else if (tipo === "CONSULTOR") {
      router.push("/consultor/estabelecimentos");
    } else if (tipo === "LIDERANCA") {
      router.push("/lideranca");
    } else {
      console.error("[Login] Tipo não reconhecido:", tipo);
      router.push("/login");
    }
  }

  async function handleIndicar(e: React.FormEvent) {
    e.preventDefault();
    setIndicarLoading(true);

    try {
      const res = await fetch("/api/v1/public/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(indicarForm),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao indicar cliente");
        return;
      }

      toast.success("Cliente indicado com sucesso!");
      setShowIndicarModal(false);
      setShowSuccessPopup(true);
      setIndicarForm({
        cpfParceiro: "",
        cpfIndicado: "",
        nomeIndicado: "",
        telefoneIndicado: "",
      });
    } catch (e) {
      toast.error("Erro ao indicar cliente");
    } finally {
      setIndicarLoading(false);
    }
  }

  function formatCpf(value: string): string {
    const v = value.replace(/\D/g, "");
    if (v.length > 9) {
      return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    }
    if (v.length > 6) {
      return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    }
    if (v.length > 3) {
      return `${v.slice(0, 3)}.${v.slice(3)}`;
    }
    return v;
  }

  async function validateIndicadoCpfRealTime(cpf: string) {
    if (cpf.length < 11) {
      setIndicadoCpfValidation("");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/public/validar-cpf?cpf=${encodeURIComponent(cpf)}`,
      );
      const data = await res.json();
      setIndicadoCpfValidation(data.valid ? "valid" : "invalid");
      if (!data.valid) {
        toast.error(data.message);
      }
    } catch (e) {
      setIndicadoCpfValidation("invalid");
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowIndicarModal(true)}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-95 transition-smooth focus-ring shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <span>👥</span>
              Indicar Cliente
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Funcionários indicam clientes para receber comissões
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Acesso Saúde Aqui © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Modal Indicar Cliente */}
      {showIndicarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Indicar Cliente
              </h2>
              <button
                onClick={() => setShowIndicarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Vincule um cliente ao seu CPF para receber comissões sobre os
              procedimentos realizados.
            </p>

            <form onSubmit={handleIndicar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF do Parceiro (Meu)
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={indicarForm.cpfParceiro}
                  onChange={(e) =>
                    setIndicarForm({
                      ...indicarForm,
                      cpfParceiro: formatCpf(e.target.value),
                    })
                  }
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  required
                  value={indicarForm.nomeIndicado}
                  onChange={(e) =>
                    setIndicarForm({
                      ...indicarForm,
                      nomeIndicado: e.target.value,
                    })
                  }
                  placeholder="Nome completo do cliente"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF do Cliente
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={indicarForm.cpfIndicado}
                  onChange={(e) => {
                    const formatted = formatCpf(e.target.value);
                    setIndicarForm({
                      ...indicarForm,
                      cpfIndicado: formatted,
                    });

                    // Validate CPF in real-time
                    if (formatted.replace(/\D/g, "").length === 11) {
                      clearTimeout((window as any).cpfTimeout);
                      (window as any).cpfTimeout = setTimeout(() => {
                        validateIndicadoCpfRealTime(formatted);
                      }, 500);
                    } else {
                      setIndicadoCpfValidation("");
                    }
                  }}
                  placeholder="000.000.000-00"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus-ring ${
                    indicadoCpfValidation === "invalid"
                      ? "border-red-500"
                      : indicadoCpfValidation === "valid"
                        ? "border-green-500"
                        : ""
                  }`}
                />
                {indicadoCpfValidation === "invalid" && (
                  <p className="text-xs text-red-600 mt-1">CPF indisponível</p>
                )}
                {indicadoCpfValidation === "valid" && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ CPF disponível
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (opcional)
                </label>
                <input
                  type="text"
                  value={indicarForm.telefoneIndicado}
                  onChange={(e) =>
                    setIndicarForm({
                      ...indicarForm,
                      telefoneIndicado: e.target.value,
                    })
                  }
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowIndicarModal(false);
                    setIndicadoCpfValidation("");
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    indicarLoading ||
                    indicadoCpfValidation === "invalid" ||
                    !indicarForm.cpfIndicado ||
                    indicadoCpfValidation !== "valid"
                  }
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {indicarLoading ? "Salvando..." : "Indicar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Indicação Realizada com Sucesso!
              </h2>
              <p className="text-gray-600 mb-6">
                O cliente <strong>{indicarForm.nomeIndicado || "indicado"}</strong>{" "}
                foi vinculado ao seu CPF corretamente.
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-smooth focus-ring"
              >
                Confirmar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
