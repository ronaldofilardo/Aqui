"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CupomConfig {
  id: string;
  codigoCupom: string;
  descricao: string | null;
  status: string;
  criadoEm: string;
  _count: { cuponsImportados: number };
}

interface Estabelecimento {
  id: string;
  nomeFantasia: string;
  cidade: string | null;
  estado: string | null;
  cupomConfig: CupomConfig | null;
}

interface PageData {
  consultor: { id: string; nome: string; email: string };
  estabelecimentos: Estabelecimento[];
}

export default function ConsultorCuponsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // form state
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState("");
  const [codigoCupom, setCodigoCupom] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/v1/gestor/consultores/${id}/cupons`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const semCupom = data?.estabelecimentos.filter((e) => !e.cupomConfig) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const res = await fetch(`/api/v1/gestor/consultores/${id}/cupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estabelecimentoId: selectedEstabelecimento,
        codigoCupom: codigoCupom.trim().toUpperCase(),
        descricao: descricao.trim() || undefined,
      }),
    });

    if (res.ok) {
      setMsg({ text: "Código de cupom cadastrado com sucesso!", type: "success" });
      setSelectedEstabelecimento("");
      setCodigoCupom("");
      setDescricao("");
      loadData();
    } else {
      const err = await res.json();
      setMsg({ text: err.error || "Erro ao cadastrar", type: "error" });
    }
    setSubmitting(false);
  }

  async function handleDelete(cupomConfigId: string) {
    if (!confirm("Remover este código de cupom?")) return;
    const res = await fetch(
      `/api/v1/gestor/consultores/${id}/cupons?cupomConfigId=${cupomConfigId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setMsg({ text: "Código removido com sucesso.", type: "success" });
      loadData();
    } else {
      const err = await res.json();
      setMsg({ text: err.error || "Erro ao remover", type: "error" });
    }
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>;
  if (!data) return <p className="text-red-600">Consultor não encontrado.</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/gestor/consultores"
          className="text-primary-600 hover:text-primary-800 text-sm"
        >
          ← Consultores
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Cupons — {data.consultor.nome}
        </h1>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {msg.text}
        </div>
      )}

      {/* Register new code */}
      {semCupom.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Registrar Código de Cupom
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estabelecimento *
              </label>
              <select
                required
                value={selectedEstabelecimento}
                onChange={(e) => setSelectedEstabelecimento(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">Selecione...</option>
                {semCupom.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nomeFantasia}
                    {e.cidade ? ` — ${e.cidade}/${e.estado}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código do Bloco de Cupons *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: A200"
                value={codigoCupom}
                onChange={(e) => setCodigoCupom(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Bloco de abril/2026"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Salvando..." : "Registrar Código"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registered codes table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Estabelecimentos e Códigos Cadastrados
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Estabelecimento</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Cidade/UF</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Código Cupom</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Descrição</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Importações</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.estabelecimentos.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{e.nomeFantasia}</td>
                <td className="px-6 py-4 text-gray-600">
                  {e.cidade && e.estado ? `${e.cidade}/${e.estado}` : "—"}
                </td>
                <td className="px-6 py-4">
                  {e.cupomConfig ? (
                    <span className="font-mono font-semibold text-gray-900">
                      {e.cupomConfig.codigoCupom}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">sem código</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {e.cupomConfig?.descricao ?? "—"}
                </td>
                <td className="px-6 py-4">
                  {e.cupomConfig ? e.cupomConfig._count.cuponsImportados : "—"}
                </td>
                <td className="px-6 py-4">
                  {e.cupomConfig ? (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${e.cupomConfig.status === "ATIVO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {e.cupomConfig.status}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4">
                  {e.cupomConfig && e.cupomConfig._count.cuponsImportados === 0 && (
                    <button
                      onClick={() => handleDelete(e.cupomConfig!.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remover
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.estabelecimentos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  Nenhum estabelecimento ativo para este consultor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
