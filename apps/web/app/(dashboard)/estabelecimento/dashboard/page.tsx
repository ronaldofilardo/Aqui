"use client";

import { useEffect, useState } from "react";
import { NextUpdateBadge } from "@/components/next-update-badge";

interface DashboardData {
  mes: number;
  ano: number;
  mesSelecionado: { consultas: number; comissao: number };
  totais: { consultas: number; comissao: number };
  evolucao: Array<{ mes: string; consultas: number; comissao: number }>;
}

function formatCurrency(value: number | null | undefined) {
  if (!value) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

export default function EstabelecimentoDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/estabelecimento/dashboard")
      .then((r) => r.json())
      .then((d) => (d?.totais ? setData(d) : setData(null)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">Erro ao carregar dados</p>
        <p className="text-gray-400 text-sm mt-1">Tente recarregar a página</p>
      </div>
    );
  }

  const maxConsultas = Math.max(...data.evolucao.map((m) => m.consultas), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {MESES[data.mes - 1]} de {data.ano}
          </p>
        </div>
        <NextUpdateBadge />
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Consultas este mês
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.mesSelecionado.consultas}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Comissão este mês
          </p>
          <p className="text-2xl font-bold text-primary-700 mt-2">
            {formatCurrency(data.mesSelecionado.comissao)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Consultas acumulado
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.totais.consultas}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Comissão acumulada
          </p>
          <p className="text-2xl font-bold text-green-700 mt-2">
            {formatCurrency(data.totais.comissao)}
          </p>
        </div>
      </div>

      {/* Gráfico de barras — evolução 6 meses */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-5">
          Evolução de Consultas (6 meses)
        </h2>
        {data.evolucao.every((m) => m.consultas === 0) ? (
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
          <div className="flex items-end gap-2 h-48">
            {data.evolucao.map((m) => (
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
                  title={`${m.mes}: ${m.consultas} consultas — ${formatCurrency(m.comissao)}`}
                />
                <span className="text-xs text-gray-400">{m.mes}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
