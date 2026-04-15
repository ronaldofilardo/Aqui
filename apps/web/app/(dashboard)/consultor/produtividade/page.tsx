"use client";

import { useEffect, useState } from "react";

interface ProdData {
  mensal: Array<{ mes: string; consultas: number; comissao: number }>;
  topEstabelecimentos: Array<{ nome: string; consultas: number }>;
  totais: {
    consultasTotal: number;
    comissaoTotal: number;
    estabelecimentos: number;
  };
}

export default function ProdutividadePage() {
  const [data, setData] = useState<ProdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/consultor/produtividade")
      .then((r) => r.json())
      .then((data) => {
        if (
          data &&
          Array.isArray(data.mensal) &&
          Array.isArray(data.topEstabelecimentos) &&
          data.totais
        ) {
          setData(data);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Carregando...</p>;
  if (!data) return <p className="text-red-500">Erro ao carregar dados.</p>;

  const maxConsultas = Math.max(...data.mensal.map((m) => m.consultas), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Produtividade</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Consultas Totais</p>
          <p className="text-3xl font-bold text-primary-700">
            {data.totais.consultasTotal}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Comissão Total</p>
          <p className="text-3xl font-bold text-green-700">
            R$ {data.totais.comissaoTotal.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Estabelecimentos</p>
          <p className="text-3xl font-bold text-blue-700">
            {data.totais.estabelecimentos}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Evolução Mensal (12 meses)
        </h2>
        <div className="flex items-end gap-2 h-48">
          {data.mensal.map((m) => (
            <div key={m.mes} className="flex-1 flex flex-col items-center">
              <div
                className="bg-primary-500 rounded-t w-full min-h-[4px]"
                style={{ height: `${(m.consultas / maxConsultas) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-1">{m.mes}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="px-6 py-4 font-semibold text-gray-800 border-b">
          Top Estabelecimentos
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500">
                Estabelecimento
              </th>
              <th className="text-left px-6 py-3 text-gray-500">Consultas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.topEstabelecimentos.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-3">{e.nome}</td>
                <td className="px-6 py-3 font-medium">{e.consultas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
