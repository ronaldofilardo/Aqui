"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Indicado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  status: string;
  totalProcedimentos: number;
  createdAt: string;
  desvinculadoEm: string | null;
}

export default function ParceiroIndicados() {
  const { data: session } = useSession();
  const [indicados, setIndicados] = useState<Indicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIndicados();
  }, []);

  async function fetchIndicados() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/parceiro/indicados");
      const data = await res.json();
      if (Array.isArray(data)) {
        setIndicados(data);
      }
    } catch (e) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ nome: "", cpf: "", telefone: "" });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/v1/parceiro/indicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao cadastrar cliente");
        return;
      }

      toast.success(`${form.nome} cadastrado com sucesso!`);
      setShowModal(false);
      fetchIndicados();
    } catch (e) {
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
          <p className="text-gray-500 text-sm">
            Cadastre clientes para receber comissões sobre procedimentos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium focus-ring"
        >
          + Cadastrar Cliente
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : indicados.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-300 text-5xl mb-4">👥</div>
          <p className="text-gray-500 mb-4">
            Nenhum cliente cadastrado ainda
          </p>
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicados.map((i) => (
            <div key={i.id} className="card hover:shadow-md transition-smooth">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{i.nome}</p>
                  <p className="text-xs text-gray-500">
                    {formatCpf(i.cpf)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    i.status === "ATIVO"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {i.status === "ATIVO" ? "Ativo" : "Inativo"}
                </span>
              </div>
              {i.telefone && (
                <p className="text-xs text-gray-500 mb-2">
                  📞 {i.telefone}
                </p>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-gray-500">
                  Desde {formatDate(i.createdAt)}
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {i.totalProcedimentos} procedimentos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Cadastrar Cliente
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) =>
                    setForm({ ...form, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={form.cpf}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    const masked =
                      v.length > 9
                        ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
                        : v.length > 6
                          ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`
                          : v.length > 3
                            ? `${v.slice(0, 3)}.${v.slice(3)}`
                            : v;
                    setForm({ ...form, cpf: masked });
                  }}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (opcional)
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}