"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface DadosParceiro {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  pixChave: string | null;
  status: string;
}

export default function ParceiroDadosPessoais() {
  const { data: session } = useSession();
  const [dados, setDados] = useState<DadosParceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    pixChave: "",
  });

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/parceiro/dados-pessoais");
      const data = await res.json();
      if (data && data.id) {
        setDados(data);
        setForm({
          nome: data.nome || "",
          telefone: data.telefone || "",
          pixChave: data.pixChave || "",
        });
      }
    } catch (e) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/v1/parceiro/dados-pessoais", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Erro ao salvar");
        return;
      }

      toast.success("Dados atualizados com sucesso");
      fetchDados();
    } catch (e) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dados Pessoais</h1>
        <p className="text-gray-500 text-sm">
          Gerencie suas informações e dados de pagamento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Suas Informações
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Nome</p>
              <p className="font-medium text-gray-900">{dados?.nome}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CPF</p>
              <p className="font-medium text-gray-900">
                {dados?.cpf ? formatCpf(dados.cpf) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{dados?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  dados?.status === "ATIVO"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {dados?.status === "ATIVO" ? "Ativo" : "Desligado"}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Editar Dados
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={form.pixChave}
                onChange={(e) =>
                  setForm({ ...form, pixChave: e.target.value })
                }
                placeholder="Sua chave PIX para recebimento"
                className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pode ser CPF, email, telefone ou chave aleatória
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}