"use client";

import { useEffect, useState } from "react";

interface ProdData {
  mensal: Array<{ mes: string; consultas: number; comissao: number }>;
  totais: { consultas: number; comissao: number };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EstabelecimentoProdutividadePage() {
  const [data, setData] = useState<ProdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/estabelecimento/produtividade")
      .then((r) => r.json())
      .then((d) => (d?.totais ? setData(d) : setData(null)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-24 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-700 font-medium">
          Erro ao carregar produtividade
        </p>
        <p className="text-gray-400 text-sm mt-1">Tente recarregar a página</p>
      </div>
    );
  }

  const maxConsultas = Math.max(...data.mensal.map((m) => m.consultas), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Produtividade</h1>

      {/* Totais */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Consultas Totais
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.totais.consultas}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Comissão Total
          </p>
          <p className="text-2xl font-bold text-primary-700 mt-2">
            {formatCurrency(data.totais.comissao)}
          </p>
        </div>
      </div>

      {/* Gráfico 12 meses */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-5">
          Evolução Mensal (12 meses)
        </h2>
        {data.totais.consultas === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              Nenhuma consulta registrada ainda
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-48">
            {data.mensal.map((m) => (
              <div
                key={m.mes}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium text-gray-600">
                  {m.consultas > 0 ? m.consultas : ""}
                </span>
                <div
                  className="w-full bg-primary-500 rounded-t min-h-[4px] transition-all"
                  style={{ height: `${(m.consultas / maxConsultas) * 100}%` }}
                  title={`${m.mes}: ${m.consultas} consultas`}
                />
                <span className="text-xs text-gray-400">{m.mes}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Detalhamento Mensal
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Mês
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Consultas
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Comissão
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...data.mensal].reverse().map((m) => (
                <tr key={m.mes} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-800">
                    {m.mes}
                  </td>
                  <td className="px-6 py-3.5 text-right text-gray-700">
                    {m.consultas}
                  </td>
                  <td className="px-6 py-3.5 text-right font-medium text-primary-700">
                    {formatCurrency(m.comissao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
