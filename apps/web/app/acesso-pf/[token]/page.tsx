"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface TokenInfo {
  parceiroId: string;
  parceiroNome: string;
  gestorNome: string;
}

export default function AcessoPFTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    senha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  async function validateToken() {
    try {
      const res = await fetch(
        `/api/auth/primeiro-acesso/${token}?token=${token}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Link inválido ou expirado");
        setLoading(false);
        return;
      }

      setTokenInfo(data);
      setLoading(false);
    } catch (e) {
      setError("Erro ao validar link");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(
        `/api/auth/primeiro-acesso/${token}?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao definir senha");
        return;
      }

      toast.success("Senha definida com sucesso!");
      router.push("/login");
    } catch (e) {
      toast.error("Erro ao definir senha");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Validando link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-xl font-bold text-gray-900">
            Definir Senha de Acesso
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Olá, <strong>{tokenInfo?.parceiroNome}</strong>!
            <br />
            Você foi indicado por <strong>{tokenInfo?.gestorNome}</strong> para
            fazer parte do sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              required
              value={form.confirmarSenha}
              onChange={(e) =>
                setForm({ ...form, confirmarSenha: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
              placeholder="Repita a senha"
            />
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">Requisitos da senha:</p>
            <ul className="text-blue-700 space-y-0.5">
              <li>• Mínimo 8 caracteres</li>
              <li>• Pelo menos 1 letra maiúscula</li>
              <li>• Pelo menos 1 número</li>
              <li>• Pelo menos 1 caractere especial</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Definir Senha"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Após definir a senha, você será redirecionado para o login.
        </p>
      </div>
    </div>
  );
}