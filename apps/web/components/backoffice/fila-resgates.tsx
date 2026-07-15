"use client";

import { useEffect, useState } from "react";

interface Resgate {
  id: string;
  parceiro: {
    id: string;
    nome: string;
    cpf: string;
  };
  premio: {
    id: string;
    nome: string;
    custoPontos: number;
  };
  cicloPontos: {
    id: string;
    nome: string;
  };
  pontosDebitados: number;
  status: string;
  solicitadoEm: string;
  processadoEm?: string;
  entregueEm?: string;
  canceladoEm?: string;
  observacao?: string;
}

export function FilaResgates() {
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string>("SOLICITADO");
  const [observacao, setObservacao] = useState<string>("");
  const [resgateParaObservacao, setResgateParaObservacao] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchResgates();
  }, [statusFiltro]);

  const fetchResgates = async () => {
    setLoading(true);
    try {
      const url = new URL(
        "/api/v1/backoffice/pontos/resgates",
        window.location.origin,
      );
      url.searchParams.append("status", statusFiltro);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Erro ao carregar resgates");
      const data = await response.json();
      setResgates(data.resgates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (resgateId: string, novoStatus: string) => {
    setProcessando(resgateId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/pontos/resgates/${resgateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            novoStatus,
            observacao: observacao || undefined,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert(`Resgate atualizado para ${novoStatus}`);
      setObservacao("");
      setResgateParaObservacao(null);
      fetchResgates();
    } catch (err) {
      alert("Erro ao atualizar resgate");
    } finally {
      setProcessando(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      SOLICITADO: "bg-yellow-100 text-yellow-700 border-yellow-200",
      EM_ANALISE: "bg-blue-100 text-blue-700 border-blue-200",
      APROVADO: "bg-green-100 text-green-700 border-green-200",
      REJEITADO: "bg-red-100 text-red-700 border-red-200",
      ENTREGUE: "bg-green-100 text-green-700 border-green-200",
      CANCELADO: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return badges[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Carregando resgates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Fila de Resgates</h2>
        <div className="flex gap-2">
          {[
            "SOLICITADO",
            "EM_ANALISE",
            "APROVADO",
            "REJEITADO",
            "ENTREGUE",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFiltro(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFiltro === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      ) : resgates.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            Nenhum resgate com status {statusFiltro}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {resgates.map((resgate) => (
            <div
              key={resgate.id}
              className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {resgate.parceiro.nome}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {resgate.parceiro.cpf}
                  </p>
                </div>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium border rounded-full ${getStatusBadge(
                    resgate.status,
                  )}`}
                >
                  {resgate.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Prêmio</p>
                  <p className="font-medium text-gray-900">
                    {resgate.premio.nome}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Pontos</p>
                  <p className="font-medium text-gray-900">
                    {resgate.pontosDebitados}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Ciclo</p>
                  <p className="font-medium text-gray-900">
                    {resgate.cicloPontos.nome}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Solicitado em</p>
                  <p className="font-medium text-gray-900">
                    {new Date(resgate.solicitadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {resgate.observacao && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Observação:</span>{" "}
                    {resgate.observacao}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                {resgate.status === "SOLICITADO" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleChangeStatus(resgate.id, "EM_ANALISE")
                      }
                      disabled={processando === resgate.id}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                        processando === resgate.id
                          ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {processando === resgate.id ? "..." : "Analisar"}
                    </button>
                  </div>
                )}

                {resgate.status === "EM_ANALISE" && (
                  <>
                    {resgateParaObservacao === resgate.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={observacao}
                          onChange={(e) => setObservacao(e.target.value)}
                          placeholder="Observação (opcional)"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleChangeStatus(resgate.id, "APROVADO")
                            }
                            disabled={processando === resgate.id}
                            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() =>
                              handleChangeStatus(resgate.id, "REJEITADO")
                            }
                            disabled={processando === resgate.id}
                            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                          >
                            Rejeitar
                          </button>
                          <button
                            onClick={() => {
                              setResgateParaObservacao(null);
                              setObservacao("");
                            }}
                            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResgateParaObservacao(resgate.id)}
                        className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
                      >
                        Aprovar/Rejeitar
                      </button>
                    )}
                  </>
                )}

                {resgate.status === "APROVADO" && (
                  <button
                    onClick={() => handleChangeStatus(resgate.id, "ENTREGUE")}
                    disabled={processando === resgate.id}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      processando === resgate.id
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {processando === resgate.id
                      ? "..."
                      : "Marcar como Entregue"}
                  </button>
                )}

                {(resgate.status === "REJEITADO" ||
                  resgate.status === "ENTREGUE" ||
                  resgate.status === "CANCELADO") && (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      Status final
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

