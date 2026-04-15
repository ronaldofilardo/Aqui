"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Usuario {
  nome: string;
  email: string;
  telefone: string | null;
}

interface ConsultorData {
  usuario: Usuario;
  pixChave: string | null;
  pixTipo: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | null;
  bancoNome: string | null;
  agencia: string | null;
  conta: string | null;
}

export default function DadosPessoaisPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    pixChave: "",
    pixTipo: "" as "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "",
    bancoNome: "",
    agencia: "",
    conta: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/v1/consultor/dados-pessoais")
      .then((r) => r.json())
      .then((data: ConsultorData) => {
        setForm({
          nome: data.usuario.nome,
          email: data.usuario.email,
          telefone: data.usuario.telefone || "",
          pixChave: data.pixChave || "",
          pixTipo: data.pixTipo || "",
          bancoNome: data.bancoNome || "",
          agencia: data.agencia || "",
          conta: data.conta || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErrors({});

    const res = await fetch("/api/v1/consultor/dados-pessoais", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setMsg("Dados salvos com sucesso!");
    } else {
      if (data.errors) {
        setErrors(data.errors);
      }
      setMsg(data.error || "Erro ao salvar dados");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dados Pessoais</h1>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes("Erro") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
        >
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Informações Pessoais
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                  errors.nome ? "border-red-500" : ""
                }`}
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                disabled
                value={form.email}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">
                Email não pode ser alterado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: formatPhone(e.target.value) })
                }
                placeholder="(11) 99999-9999"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                  errors.telefone ? "border-red-500" : ""
                }`}
              />
              {errors.telefone && (
                <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Dados Bancários
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de PIX
              </label>
              <select
                value={form.pixTipo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pixTipo: (e.target.value as any) || "",
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                  errors.pixTipo ? "border-red-500" : ""
                }`}
              >
                <option value="">Selecione um tipo...</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">Email</option>
                <option value="TELEFONE">Telefone</option>
              </select>
              {errors.pixTipo && (
                <p className="text-red-500 text-sm mt-1">{errors.pixTipo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={form.pixChave}
                onChange={(e) => setForm({ ...form, pixChave: e.target.value })}
                placeholder="CPF, CNPJ, email ou telefone"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                  errors.pixChave ? "border-red-500" : ""
                }`}
              />
              {errors.pixChave && (
                <p className="text-red-500 text-sm mt-1">{errors.pixChave}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banco
              </label>
              <input
                type="text"
                value={form.bancoNome}
                onChange={(e) =>
                  setForm({ ...form, bancoNome: e.target.value })
                }
                placeholder="Ex: Banco do Brasil"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                  errors.bancoNome ? "border-red-500" : ""
                }`}
              />
              {errors.bancoNome && (
                <p className="text-red-500 text-sm mt-1">{errors.bancoNome}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  value={form.agencia}
                  onChange={(e) =>
                    setForm({ ...form, agencia: e.target.value })
                  }
                  placeholder="0001"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                    errors.agencia ? "border-red-500" : ""
                  }`}
                />
                {errors.agencia && (
                  <p className="text-red-500 text-sm mt-1">{errors.agencia}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta
                </label>
                <input
                  type="text"
                  value={form.conta}
                  onChange={(e) => setForm({ ...form, conta: e.target.value })}
                  placeholder="12345-6"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                    errors.conta ? "border-red-500" : ""
                  }`}
                />
                {errors.conta && (
                  <p className="text-red-500 text-sm mt-1">{errors.conta}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
