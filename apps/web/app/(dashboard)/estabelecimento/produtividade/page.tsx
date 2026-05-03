"use client";

import { useEffect, useState } from "react";

interface ProdData {
  mensal: Array<{ mes: string; consultas: number }>;
  totais: { consultas: number };
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
        <div className="h-24 bg-gray-200 rounded-xl" />
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
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Consultas Totais
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {data.totais.consultas}
        </p>
      </div>

      {/* Gráfico 12 meses */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-5">
          Evolução Mensal (12 meses)
        </h2>
        {data.totais.consultas === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
