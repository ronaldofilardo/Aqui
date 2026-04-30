"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ConviteInfo {
  estabelecimentoId: string;
  nomeFantasia: string;
  jaTemAcesso: boolean;
}

export default function AcessoPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<ConviteInfo | null>(null);
  const [status, setStatus] = useState<
    "loading" | "invalid" | "ready" | "success"
  >("loading");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmar: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    fetch(`/api/v1/public/convite/${token}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) {
          setStatus("invalid");
          return;
        }
        setInfo(data);
        setStatus("ready");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email inválido";
    if (!form.senha) errs.senha = "Senha é obrigatória";
    else if (form.senha.length < 6) errs.senha = "Mínimo 6 caracteres";
    if (form.senha !== form.confirmar)
      errs.confirmar = "As senhas não conferem";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !info) return;

    setSubmitting(true);
    setServerError("");

    const res = await fetch("/api/auth/estabelecimento/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estabelecimentoId: info.estabelecimentoId,
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        inviteToken: token,
      }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const data = await res.json();
      setServerError(data.error || "Erro ao criar acesso. Tente novamente.");
    }

    setSubmitting(false);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Verificando link...</div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-gray-500 text-sm">
            Este link não é mais válido. Solicite um novo ao seu consultor.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Acesso criado com sucesso!
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Seu acesso ao portal de <strong>{info?.nomeFantasia}</strong> foi
            configurado. Faça login para continuar.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition text-sm font-medium w-full"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full">
        <div className="mb-6">
          <div className="text-3xl mb-3">🏥</div>
          <h1 className="text-xl font-bold text-gray-900">Criar acesso</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure seu acesso ao portal de{" "}
            <strong className="text-gray-700">{info?.nomeFantasia}</strong>
          </p>
          {info?.jaTemAcesso && (
            <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Já existe um usuário cadastrado para este estabelecimento. Se
              precisar de ajuda, entre em contato com seu consultor.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu nome
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: João Silva"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.nome ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.nome && (
              <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de acesso
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.email ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.senha ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.senha && (
              <p className="text-red-500 text-xs mt-1">{errors.senha}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <input
              type="password"
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
              placeholder="Repita a senha"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.confirmar ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.confirmar && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmar}</p>
            )}
          </div>

          {serverError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 mt-2"
          >
            {submitting ? "Criando acesso..." : "Criar acesso"}
          </button>
        </form>
      </div>
    </div>
  );
}
