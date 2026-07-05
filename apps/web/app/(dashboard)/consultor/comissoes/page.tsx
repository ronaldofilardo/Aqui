"use client";

import { useEffect, useState } from "react";
import { NextUpdateBadge } from "@/components/next-update-badge";

interface ComissaoItem {
  id: string;
  periodo: string;
  estabelecimentoNome: string;
  consultasCount: number;
  valorBruto: number;
  percentual: number;
  valorComissao: number;
  status: "PAGO" | "PENDENTE";
  criadoEm: string;
  pixChave?: string;
}

interface ComissoesResponse {
  data: ComissaoItem[];
  resumo: { totalPago: number; totalPendente: number; total: number };
}

type StatusFilter = "ALL" | "PAGO" | "PENDENTE";

export default function ComissoesPage() {
  const [data, setData] = useState<ComissoesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [mesFilter, setMesFilter] = useState(new Date().getMonth() + 1);
  const [anoFilter, setAnoFilter] = useState(new Date().getFullYear());

  useEffect(() => {
    const params = new URLSearchParams({
      mes: mesFilter.toString(),
      ano: anoFilter.toString(),
    });

    setLoading(true);
    setError(null);

    fetch(`/api/v1/consultor/comissoes?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar comissões");
        return r.json();
      })
      .then((d) => {
        if (d?.resumo) {
          setData(d);
        } else {
          setError("Formato de resposta inválido");
        }
      })
      .catch((err) => {
        console.error("Erro:", err);
        setError(err.message || "Erro ao carregar comissões");
      })
      .finally(() => setLoading(false));
  }, [mesFilter, anoFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando comissões...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">
          {error || "Erro ao carregar comissões"}
        </p>
      </div>
    );
  }

  const filtered = (data?.data ?? []).filter((item) =>
    statusFilter === "ALL" ? true : item.status === statusFilter
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comissões</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe suas comissões pagas e a receber
          </p>
        </div>
        <NextUpdateBadge />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(data.resumo.total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pago</p>
              <p className="text-3xl font-bold text-green-700 mt-2">
                {formatCurrency(data.resumo.totalPago)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">A Receber</p>
              <p className="text-3xl font-bold text-amber-700 mt-2">
                {formatCurrency(data.resumo.totalPendente)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 text-xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mês
            </label>
            <select
              value={mesFilter}
              onChange={(e) => setMesFilter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString("pt-BR", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ano
            </label>
            <select
              value={anoFilter}
              onChange={(e) => setAnoFilter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "ALL"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("PAGO")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "PAGO"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pago
              </button>
              <button
                onClick={() => setStatusFilter("PENDENTE")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === "PENDENTE"
                    ? "bg-amber-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                A Receber
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-4 text-gray-700 font-semibold">
                Período
              </th>
              <th className="text-left px-6 py-4 text-gray-700 font-semibold">
                Estabelecimento
              </th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">
                Consultas
              </th>
              <th className="text-right px-6 py-4 text-gray-700 font-semibold">
                Valor Bruto
              </th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">
                %
              </th>
              <th className="text-right px-6 py-4 text-gray-700 font-semibold">
                Comissão
              </th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma comissão encontrada para o período selecionado
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.periodo}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.estabelecimentoNome}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    {item.consultasCount}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    {formatCurrency(item.valorBruto)}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    {item.percentual.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-700">
                    {formatCurrency(item.valorComissao)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "PAGO"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "PAGO" ? "✓ Pago" : "⏳ Pendente"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {filtered.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Mostrando {filtered.length} de {data.data.length} comissão(ões)
        </div>
      )}
    </div>
  );
}
