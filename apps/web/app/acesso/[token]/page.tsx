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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resetLink, setResetLink] = useState<string>("");

  useEffect(() => {
    async function validateToken() {
      try {
        // Try to validate as reset token (for consultors/users)
        const resetRes = await fetch(`/api/auth/validate-reset-token/${token}`);
        if (resetRes.ok) {
          const data = await resetRes.json();
          // If it's a reset token for a user (not estabelecimento), redirect to password reset
          if (data.type === "USUARIO") {
            setResetLink(`/reset-senha?token=${token}&type=USUARIO`);
            setStatus("success");
            return;
          }
        }

        // Try to validate as invite token (for establishments)
        const inviteRes = await fetch(`/api/v1/public/convite/${token}`);
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          setInfo(inviteData);
          setStatus("ready");
          return;
        }

        setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    }

    validateToken();
  }, [token]);

  useEffect(() => {
    if (status === "success" && resetLink) {
      const timer = setTimeout(() => {
        router.push(resetLink);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, resetLink, router]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email inválido";
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
        inviteToken: token,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResetLink(data.link || "/reset-senha");
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
            {submitting ? "Criando acesso..." : "Prosseguir"}
          </button>
        </form>
      </div>
    </div>
  );
}
