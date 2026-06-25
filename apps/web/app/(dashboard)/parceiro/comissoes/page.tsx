"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Procedimento {
  id: string;
  dataReferencia: string;
  dataPagamento: string;
  paciente: string;
  procedimento: string;
  totalPago: string;
  valorComissao: string;
  statusComissao: string;
  indicado: {
    id: string;
    nome: string;
    cpf: string;
  } | null;
}

interface ComissaoData {
  procedimentos: Procedimento[];
  resumo: {
    totalComissao: number;
    totalPago: number;
    totalPendente: number;
    totalProcedimentos: number;
  };
  historico: Array<{
    id: string;
    mesReferencia: string;
    valorTotal: string;
    status: string;
  }>;
}

export default function ParceiroComissoes() {
  const { data: session } = useSession();
  const [data, setData] = useState<ComissaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string>("");

  useEffect(() => {
    fetchComissoes();
  }, [mesSelecionado]);

  async function fetchComissoes() {
    setLoading(true);
    try {
      const url = mesSelecionado
        ? `/api/v1/parceiro/comissoes?mesReferencia=${mesSelecionado}`
        : "/api/v1/parceiro/comissoes";
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.resumo) {
        setData(json);
      } else if (Array.isArray(json)) {
        setData({
          procedimentos: json,
          resumo: { totalComissao: 0, totalPago: 0, totalPendente: 0, totalProcedimentos: 0 },
          historico: [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatMes(mes: string) {
    const [ano, mesNum] = mes.split("-");
    const date = new Date(Number(ano), Number(mesNum) - 1);
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }

  const mesesDisponiveis = data?.historico.map((h) => h.mesReferencia) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Comissões</h1>
        <p className="text-gray-500 text-sm">
          Acompanhe suas comissões por procedimentos realizados
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-6 w-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 w-20 bg-gray-100 rounded mb-2"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <span className="text-2xl">💰</span>
              <p className="text-xs text-gray-500 font-medium mb-1">
                Total Acumulado
              </p>
              <p className="text-3xl font-bold text-primary-600">
                R${" "}
                {data.resumo.totalComissao.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="stat-card">
              <span className="text-2xl">✅</span>
              <p className="text-xs text-gray-500 font-medium mb-1">Pago</p>
              <p className="text-3xl font-bold text-green-600">
                R${" "}
                {data.resumo.totalPago.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="stat-card">
              <span className="text-2xl">⏳</span>
              <p className="text-xs text-gray-500 font-medium mb-1">Pendente</p>
              <p className="text-3xl font-bold text-yellow-600">
                R${" "}
                {data.resumo.totalPendente.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {mesesDisponiveis.length > 0 && (
            <div className="mb-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setMesSelecionado("")}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  !mesSelecionado
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              {mesesDisponiveis.map((mes) => (
                <button
                  key={mes}
                  onClick={() => setMesSelecionado(mes)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    mesSelecionado === mes
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {formatMes(mes)}
                </button>
              ))}
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Procedimentos que Geraram Comissão
            </h2>
            {data.procedimentos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-300 text-4xl mb-2">—</div>
                <p className="text-gray-500 text-sm">
                  Nenhum procedimento registrado
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-600">
                        Data
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-600">
                        Cliente
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-600">
                        Procedimento
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-600">
                        Valor Pago
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-600">
                        Comissão
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.procedimentos.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-600">
                          {formatDate(p.dataReferencia)}
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-gray-900">
                            {p.indicado?.nome || p.paciente}
                          </p>
                        </td>
                        <td className="p-3 text-gray-600">{p.procedimento}</td>
                        <td className="p-3 text-right text-gray-900">
                          R${" "}
                          {Number(p.totalPago).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-3 text-right text-green-600 font-medium">
                          R${" "}
                          {Number(p.valorComissao).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              p.statusComissao === "PAGA"
                                ? "bg-green-100 text-green-800"
                                : p.statusComissao === "CALCULADA"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {p.statusComissao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-300 text-5xl mb-4">💰</div>
          <p className="text-gray-500">Nenhum dado disponível</p>
        </div>
      )}
    </div>
  );
}