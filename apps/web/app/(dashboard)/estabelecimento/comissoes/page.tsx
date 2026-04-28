"use client";

import { useEffect, useState } from "react";

interface Comissao {
  id: string;
  pacienteNome: string;
  servico: string;
  dataConsulta: string | null;
  statusConsulta: string | null;
  valorEstabelecimento: number;
  statusPagamento: "PENDENTE" | "PAGO" | "CANCELADO";
  dataPagamento: string | null;
  criadoEm: string;
}

interface ComissoesData {
  mes: number;
  ano: number;
  comissoes: Comissao[];
  totalConsultas: number;
  totalComissao: number;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDENTE: {
    label: "Pendente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PAGO: {
    label: "Pago",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function EstabelecimentoComissoesPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState<ComissoesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/estabelecimento/comissoes?mes=${mes}&ano=${ano}`)
      .then((r) => r.json())
      .then((d) => (Array.isArray(d?.comissoes) ? setData(d) : setData(null)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [mes, ano]);

  const anos = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header + filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Comissões</h1>
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumo */}
      {!loading && data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Consultas no período
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.totalConsultas}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total comissão
            </p>
            <p className="text-2xl font-bold text-primary-700 mt-2">
              {formatCurrency(data.totalComissao)}
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Detalhamento — {MESES[mes - 1]} / {ano}
          </h2>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/6 ml-auto" />
              </div>
            ))}
          </div>
        ) : !data || data.comissoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              Nenhuma comissão registrada para este período
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Paciente
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Serviço
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Data Consulta
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Comissão
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.comissoes.map((c) => {
                  const st =
                    STATUS_MAP[c.statusPagamento] ?? STATUS_MAP.PENDENTE;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-gray-800">
                        {c.pacienteNome}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">{c.servico}</td>
                      <td className="px-6 py-3.5 text-gray-500">
                        {formatDate(c.dataConsulta)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-primary-700">
                        {formatCurrency(c.valorEstabelecimento)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
