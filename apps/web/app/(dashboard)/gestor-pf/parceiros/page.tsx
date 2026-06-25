"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Indicado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  status: string;
  createdAt: string;
}

interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  pixChave: string | null;
  percentualComissao: string;
  status: string;
  totalIndicados: number;
  desligadoEm: string | null;
  createdAt: string;
  indicacoes: Indicado[];
}

export default function GestorPFParceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editParceiro, setEditParceiro] = useState<Parceiro | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    pixChave: "",
    telefone: "",
    percentualComissao: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchParceiros();
  }, []);

  async function fetchParceiros() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/parceiros");
      const data = await res.json();
      if (Array.isArray(data)) {
        setParceiros(data);
      }
    } catch (e) {
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditParceiro(null);
    setForm({
      nome: "",
      email: "",
      cpf: "",
      pixChave: "",
      telefone: "",
      percentualComissao: "",
    });
    setShowModal(true);
  }

  function openEdit(p: Parceiro) {
    setEditParceiro(p);
    setForm({
      nome: p.nome,
      email: p.email,
      cpf: p.cpf,
      pixChave: p.pixChave || "",
      telefone: "",
      percentualComissao: p.percentualComissao,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editParceiro
        ? "/api/v1/gestor-pf/parceiros"
        : "/api/v1/gestor-pf/parceiros";
      const method = editParceiro ? "PUT" : "POST";

      const payload: any = { ...form };
      if (editParceiro) {
        payload.id = editParceiro.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      if (!editParceiro && data.link) {
        await navigator.clipboard.writeText(data.link);
        toast.success(
          "Parceiro criado! Link copiado para clipboard."
        );
      } else {
        toast.success("Parceiro atualizado com sucesso");
      }

      setShowModal(false);
      fetchParceiros();
    } catch (e) {
      toast.error("Erro ao salvar parceiro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDesligar(p: Parceiro) {
    if (
      !confirm(
        `Desligar ${p.nome}? Os vínculos com clientes serão desfeitos e as comissões cessarão.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/gestor-pf/parceiros?id=${p.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao desligar");
        return;
      }

      toast.success("Parceiro desligado com sucesso");
      fetchParceiros();
    } catch (e) {
      toast.error("Erro ao desligar parceiro");
    }
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function toggleExpand(id: string) {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
          <p className="text-gray-500 text-sm">
            Gerencie parceiros e suas comissões
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium focus-ring"
        >
          + Novo Parceiro
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
      ) : parceiros.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-300 text-5xl mb-4">👥</div>
          <p className="text-gray-500 mb-4">Nenhum parceiro cadastrado</p>
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Criar primeiro parceiro
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-600 w-8"></th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Nome
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  CPF
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Email
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  % Comissão
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Clientes
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="text-right p-3 font-semibold text-gray-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {parceiros.map((p) => (
                <>
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="text-gray-500 hover:text-gray-700 text-lg"
                      >
                        {expandedIds.has(p.id) ? "▼" : "▶"}
                      </button>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{p.nome}</td>
                    <td className="p-3 text-gray-600">{formatCpf(p.cpf)}</td>
                    <td className="p-3 text-gray-600">{p.email}</td>
                    <td className="p-3 text-gray-600">
                      {Number(p.percentualComissao).toFixed(2)}%
                    </td>
                    <td className="p-3 text-gray-600">{p.totalIndicados}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          p.status === "ATIVO"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.status === "ATIVO" ? "Ativo" : "Desligado"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                        >
                          Editar
                        </button>
                        {p.status === "ATIVO" && (
                          <button
                            onClick={() => handleDesligar(p)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Desligar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedIds.has(p.id) && p.indicacoes.length > 0 && (
                    <tr key={`${p.id}-indicados`} className="bg-gray-50">
                      <td colSpan={8} className="p-0">
                        <div className="px-6 py-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Clientes Indicados por {p.nome}
                          </p>
                          <table className="w-full text-xs bg-white rounded border">
                            <thead>
                              <tr className="border-b bg-gray-100">
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Nome
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  CPF
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Telefone
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Status
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Data/Hora
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.indicacoes.map((i) => (
                                <tr key={i.id} className="border-b last:border-b-0">
                                  <td className="p-2 text-gray-900">{i.nome}</td>
                                  <td className="p-2 text-gray-600">
                                    {formatCpf(i.cpf)}
                                  </td>
                                  <td className="p-2 text-gray-600">
                                    {i.telefone || "-"}
                                  </td>
                                  <td className="p-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        i.status === "ATIVO"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {i.status === "ATIVO" ? "Ativo" : "Desvinculado"}
                                    </span>
                                  </td>
                                  <td className="p-2 text-gray-500">
                                    {formatDateTime(i.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedIds.has(p.id) && p.indicacoes.length === 0 && (
                    <tr key={`${p.id}-empty`} className="bg-gray-50">
                      <td colSpan={8} className="p-3 text-center text-gray-500 text-sm">
                        Nenhum cliente indicado ainda
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editParceiro ? "Editar Parceiro" : "Novo Parceiro"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) =>
                    setForm({ ...form, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
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
                    const masked = v.length > 11 ? v.slice(0, 11) : v;
                    const f =
                      masked.length > 9
                        ? `${masked.slice(0, 3)}.${masked.slice(3, 6)}.${masked.slice(6, 9)}-${masked.slice(9)}`
                        : masked.length > 6
                          ? `${masked.slice(0, 3)}.${masked.slice(3, 6)}.${masked.slice(6)}`
                          : masked.length > 3
                            ? `${masked.slice(0, 3)}.${masked.slice(3)}`
                            : masked;
                    setForm({ ...form, cpf: f });
                  }}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  % Comissão
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.percentualComissao}
                  onChange={(e) =>
                    setForm({ ...form, percentualComissao: e.target.value })
                  }
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
                  {saving ? "Salvando..." : editParceiro ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}