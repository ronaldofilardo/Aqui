"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ComissaoMes {
  id: string;
  mesReferencia: string;
  valorTotal: string;
  status: string;
  dataPagamento: string | null;
}

interface ParceiroComissao {
  id: string;
  nome: string;
  cpf: string;
  status: string;
  percentualComissao: string;
  totalIndicados: number;
  totalPendente: number;
  totalPago: number;
  comissoes: ComissaoMes[];
  procedimentosRecentes: Array<{
    id: string;
    dataReferencia: string;
    paciente: string;
    procedimento: string;
    totalPago: string;
    valorComissao: string;
    statusComissao: string;
  }>;
}

export default function GestorPFComissoes() {
  const [data, setData] = useState<ParceiroComissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParceiro, setSelectedParceiro] =
    useState<ParceiroComissao | null>(null);

  useEffect(() => {
    fetchComissoes();
  }, []);

  async function fetchComissoes() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/comissoes");
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
        if (json.length > 0 && !selectedParceiro) {
          setSelectedParceiro(json[0]);
        }
      }
    } catch (e) {
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuitar(parceiroId: string, mesReferencia: string) {
    if (!confirm("Confirmar quitação desta comissão?\n\nApós confirmar, ela será retirada do fluxo de pagamento pendente.")) return;

    try {
      const res = await fetch("/api/v1/gestor-pf/comissoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parceiroId,
          mesReferencia,
          status: "PAGA",
        }),
      });

      if (!res.ok) {
        toast.error("Erro ao quitar comissão");
        return;
      }

      toast.success("Comissão marcada como paga!");
      fetchComissoes();
    } catch (e) {
      toast.error("Erro ao quitar comissão");
    }
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatMes(mes: string) {
    const [ano, mesNum] = mes.split("-");
    const date = new Date(Number(ano), Number(mesNum) - 1);
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissões</h1>
        <p className="text-gray-500 text-sm">
          Gerencie comissões dos parceiros
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 card animate-pulse">
            <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 w-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-300 text-5xl mb-4">💰</div>
          <p className="text-gray-500">Nenhum dado de comissão encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {data.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedParceiro(p)}
                className={`card w-full text-left transition-smooth hover:shadow-md ${
                  selectedParceiro?.id === p.id
                    ? "ring-2 ring-primary-500"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-900">{p.nome}</p>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === "ATIVO"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {p.status === "ATIVO" ? "Ativo" : "Desligado"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {formatCpf(p.cpf)} · {p.percentualComissao}% comissão
                </p>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {p.totalIndicados} clientes
                  </span>
                  <span className="text-sm font-bold text-yellow-600">
                    R${" "}
                    {p.totalPendente.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedParceiro && (
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedParceiro.nome}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedParceiro.percentualComissao}% sobre Total Pago
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Pendente</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      R${" "}
                      {selectedParceiro.totalPendente.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Pago: R${" "}
                      {selectedParceiro.totalPago.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {selectedParceiro.comissoes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Histórico de Comissões por Mês
                    </h3>
                    <div className="space-y-2">
                      {selectedParceiro.comissoes.map((c) => (
                        <div
                          key={c.id}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            c.status === "PAGA"
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatMes(c.mesReferencia)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  c.status === "PAGA"
                                    ? "bg-green-100 text-green-800"
                                    : c.status === "CALCULADA"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {c.status === "PAGA"
                                  ? "PAGO"
                                  : c.status}
                              </span>
                              {c.status === "PAGA" && c.dataPagamento && (
                                <span className="text-xs text-green-600">
                                  em {formatDateTime(c.dataPagamento)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">
                              R${" "}
                              {Number(c.valorTotal).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            {c.status !== "PAGA" && (
                              <button
                                onClick={() =>
                                  handleQuitar(selectedParceiro.id, c.mesReferencia)
                                }
                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium"
                              >
                                Marcar como Pago
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Procedimentos Recentes
                  </h3>
                  {selectedParceiro.procedimentosRecentes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum procedimento registrado
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-2 font-medium text-gray-600">
                              Data
                            </th>
                            <th className="text-left p-2 font-medium text-gray-600">
                              Paciente
                            </th>
                            <th className="text-left p-2 font-medium text-gray-600">
                              Procedimento
                            </th>
                            <th className="text-right p-2 font-medium text-gray-600">
                              Total Pago
                            </th>
                            <th className="text-right p-2 font-medium text-gray-600">
                              Comissão
                            </th>
                            <th className="text-left p-2 font-medium text-gray-600">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedParceiro.procedimentosRecentes.map((p) => (
                            <tr key={p.id} className="border-b">
                              <td className="p-2 text-gray-600">
                                {formatDate(p.dataReferencia)}
                              </td>
                              <td className="p-2 text-gray-900">{p.paciente}</td>
                              <td className="p-2 text-gray-600">
                                {p.procedimento}
                              </td>
                              <td className="p-2 text-right text-gray-900">
                                R${" "}
                                {Number(p.totalPago).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-2 text-right text-green-600 font-medium">
                                R${" "}
                                {Number(p.valorComissao).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    p.statusComissao === "PAGA"
                                      ? "bg-green-100 text-green-800"
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}