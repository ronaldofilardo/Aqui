"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardData {
  totalParceiros: number;
  parceirosAtivos: number;
  totalIndicados: number;
  totalComissaoPendente: number;
  totalComissaoPaga: number;
  recentes: Array<{
    id: string;
    nome: string;
    cpf: string;
    totalProcedimentos: number;
    totalComissao: number;
  }>;
}

export default function BackofficeDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/backoffice/comissoes")
      .then((r) => r.json())
      .then((res) => {
        if (res && Array.isArray(res)) {
          const totalParceiros = res.length;
          const parceirosAtivos = res.filter(
            (p: any) => p.status === "ATIVO"
          ).length;
          const totalIndicados = res.reduce(
            (sum: number, p: any) => sum + (p.totalIndicados || 0),
            0
          );
          const totalComissaoPendente = res.reduce(
            (sum: number, p: any) => sum + (p.totalPendente || 0),
            0
          );
          const totalComissaoPaga = res.reduce((sum: number, p: any) => {
            return (
              sum +
              (p.comissoes || [])
                .filter((c: any) => c.status === "PAGA")
                .reduce((s: number, c: any) => s + Number(c.valorTotal), 0)
            );
          }, 0);

          setData({
            totalParceiros,
            parceirosAtivos,
            totalIndicados,
            totalComissaoPendente,
            totalComissaoPaga,
            recentes: res.slice(0, 5).map((p: any) => ({
              id: p.id,
              nome: p.nome,
              cpf: p.cpf,
              totalProcedimentos: p.totalIndicados,
              totalComissao: p.totalPendente,
            })),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8 space-y-8">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-6 w-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );

  const d = data || {
    totalParceiros: 0,
    parceirosAtivos: 0,
    totalIndicados: 0,
    totalComissaoPendente: 0,
    totalComissaoPaga: 0,
    recentes: [],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard PF</h1>
      <p className="text-gray-500 mb-8">Bem-vindo, {session?.user?.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <span className="text-2xl">👥</span>
          <p className="text-xs text-gray-500 font-medium mb-1">
            Total Parceiros
          </p>
          <p className="text-3xl font-bold text-blue-600">{d.totalParceiros}</p>
        </div>
        <div className="stat-card">
          <span className="text-2xl">✅</span>
          <p className="text-xs text-gray-500 font-medium mb-1">
            Parceiros Ativos
          </p>
          <p className="text-3xl font-bold text-green-600">
            {d.parceirosAtivos}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-2xl">👤</span>
          <p className="text-xs text-gray-500 font-medium mb-1">
            Clientes Indicados
          </p>
          <p className="text-3xl font-bold text-purple-600">
            {d.totalIndicados}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-2xl">💰</span>
          <p className="text-xs text-gray-500 font-medium mb-1">
            Comissão Pendente
          </p>
          <p className="text-3xl font-bold text-yellow-600">
            R$ {d.totalComissaoPendente.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Parceiros Recentes
          </h2>
          {d.recentes.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-gray-300 text-4xl mb-2">—</div>
              <p className="text-gray-500 text-sm">Nenhum parceiro registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {d.recentes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.totalProcedimentos} clientes indicados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      R${" "}
                      {p.totalComissao.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Resumo de Comissões
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-800">Pendente</span>
              <span className="text-xl font-bold text-yellow-700">
                R${" "}
                {d.totalComissaoPendente.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="text-sm text-green-800">Paga</span>
              <span className="text-xl font-bold text-green-700">
                R${" "}
                {d.totalComissaoPaga.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
