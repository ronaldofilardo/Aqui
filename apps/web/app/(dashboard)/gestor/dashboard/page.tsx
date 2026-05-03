"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardData {
  resumo: {
    totalConsultores: number;
    totalEstabelecimentos: number;
    consultasMes: number;
    consultasMesAnterior: number;
    variacaoConsultas: number;
    totalCuponsImportados: number;
    totalCuponsImportadosAnterior: number;
    variacaoCupons: number;
    mesAtual: number;
    anoAtual: number;
  };
  topConsultores: Array<{
    nome: string;
    totalConsultas: number;
  }>;
  evolucao: Array<{ mes: number; ano: number; totalConsultas: number }>;
}

function getVariacaoColor(variacao: number): string {
  if (variacao > 0) return "text-green-600";
  if (variacao < 0) return "text-red-600";
  return "text-gray-500";
}

function getVariacaoIcon(variacao: number): string {
  if (variacao > 0) return "↑";
  if (variacao < 0) return "↓";
  return "→";
}

function getIcon(label: string): string {
  const icons: { [key: string]: string } = {
    Consultores: "👥",
    Estabelecimentos: "🏢",
    Consultas: "📅",
    Cupons: "🎟️",
    "Comissões Pagas": "✅",
    "A Receber": "⏳",
  };
  return icons[label] || "📊";
}

function StatCardEnhanced({
  label,
  value,
  variacao,
  icon,
  color,
  subtexto,
}: {
  label: string;
  value: number | string;
  variacao?: number;
  icon: string;
  color: string;
  subtexto?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {variacao !== undefined && (
          <span
            className={`text-xs font-semibold ${getVariacaoColor(variacao)}`}
          >
            {getVariacaoIcon(variacao)} {Math.abs(variacao)}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {subtexto && <p className="text-xs text-gray-400 mt-2">{subtexto}</p>}
    </div>
  );
}

function AlertCard({
  title,
  message,
  value,
  action,
  actionLabel,
}: {
  title: string;
  message: string;
  value: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="status-alert p-6 col-span-full">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-yellow-900 text-sm mb-1">
            {title}
          </h3>
          <p className="text-yellow-800 text-sm">{message}</p>
          <p className="text-2xl font-bold text-yellow-900 mt-2">{value}</p>
        </div>
        {action && (
          <button
            onClick={action}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-smooth text-sm font-medium whitespace-nowrap ml-4 focus-ring"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function GestorDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/gestor/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8 space-y-8">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-6 w-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-1">Erro ao carregar</h3>
          <p className="text-red-800 text-sm">
            Não foi possível carregar os dados do dashboard. Tente novamente.
          </p>
        </div>
      </div>
    );

  const { resumo, topConsultores, evolucao } = data;
  const mesNome = new Date(resumo.anoAtual, resumo.mesAtual - 1).toLocaleString(
    "pt-BR",
    { month: "long", year: "numeric" },
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bem-vindo, {session?.user?.name}</p>

      {/* PRODUTIVIDADE */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Produtividade
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCardEnhanced
            label="Consultas do Mês"
            value={resumo.consultasMes}
            variacao={resumo.variacaoConsultas}
            icon="📅"
            color="text-blue-600"
            subtexto={`vs ${new Date(resumo.anoAtual, resumo.mesAtual - 2).toLocaleString("pt-BR", { month: "short" })}`}
          />
          <StatCardEnhanced
            label="Cupons Importados"
            value={resumo.totalCuponsImportados}
            variacao={resumo.variacaoCupons}
            icon="🎟️"
            color="text-purple-600"
            subtexto={`Total: ${resumo.totalCuponsImportados}`}
          />
          <StatCardEnhanced
            label="Estabelecimentos Ativos"
            value={resumo.totalEstabelecimentos}
            icon="🏢"
            color="text-green-600"
            subtexto="Em operação"
          />
        </div>
      </div>

      {/* PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Consultores */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Top Consultores
          </h2>
          {topConsultores.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-gray-300 text-4xl mb-2">—</div>
              <p className="text-gray-500 text-sm">
                Nenhum consultor registrado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topConsultores.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-smooth hover:shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {i + 1}. {c.nome}
                      </span>
                      {i === 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          #1
                        </span>
                      )}
                      {i === 1 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          #2
                        </span>
                      )}
                      {i === 2 && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          #3
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>{c.totalConsultas} consultas</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evolução Mensal */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Últimos 6 Meses
          </h2>
          {evolucao.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-gray-300 text-4xl mb-2">—</div>
              <p className="text-gray-500 text-sm">Sem dados históricos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evolucao.map((e, i) => {
                const maxConsultas = Math.max(
                  ...evolucao.map((x) => x.totalConsultas),
                  1,
                );
                const percentWidth = (e.totalConsultas / maxConsultas) * 100;
                const isCurrentMonth = i === evolucao.length - 1;

                return (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium w-12 text-right ${
                        isCurrentMonth
                          ? "text-primary-600 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      {String(e.mes).padStart(2, "0")}/{String(e.ano).slice(-2)}
                    </span>
                    <div className="flex-1 relative">
                      <div className="bg-gray-100 rounded-full h-8 flex items-center justify-end pr-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full flex items-center justify-center transition-smooth ${
                            isCurrentMonth
                              ? "bg-gradient-to-r from-primary-500 to-primary-600"
                              : "bg-primary-400"
                          }`}
                          style={{ width: `${Math.max(10, percentWidth)}%` }}
                        >
                          <span className="text-xs text-white font-bold">
                            {e.totalConsultas}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
