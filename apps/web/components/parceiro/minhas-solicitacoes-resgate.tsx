"use client";

import { useEffect, useState } from "react";

interface Resgate {
  id: string;
  premio: { id: string; nome: string; custoPontos: number };
  cicloPontos: { id: string; nome: string };
  pontosDebitados: number;
  status: string;
  solicitadoEm: string;
  entregueEm?: string;
  canceladoEm?: string;
  observacao?: string;
  podesCancelar: boolean;
}

export function MinhassolicitacoesResgate() {
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResgates() {
      try {
        const response = await fetch("/api/v1/parceiro/pontos/resgates");
        if (!response.ok) throw new Error("Erro ao carregar solicitações");
        const data = await response.json();
        setResgates(data.resgates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchResgates();
  }, []);

  const handleCancelar = async (resgateId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta solicitação?")) return;

    setCancelando(resgateId);
    try {
      const response = await fetch(
        `/api/v1/parceiro/pontos/resgates/${resgateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "CANCELAR" }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      } else {
        alert(
          "Solicitação cancelada com sucesso! Pontos foram devolvidos ao saldo.",
        );
        // Recarregar
        const response = await fetch("/api/v1/parceiro/pontos/resgates");
        const data = await response.json();
        setResgates(data.resgates);
      }
    } catch (err) {
      alert("Erro ao cancelar solicitação");
    } finally {
      setCancelando(null);
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

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      SOLICITADO: "Solicitado",
      EM_ANALISE: "Em Análise",
      APROVADO: "Aprovado",
      REJEITADO: "Rejeitado",
      ENTREGUE: "Entregue ✓",
      CANCELADO: "Cancelado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Carregando solicitações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (resgates.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">
          Você ainda não tem solicitações de resgate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resgates.map((resgate) => (
        <div
          key={resgate.id}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {resgate.premio.nome}
              </h3>
              <p className="text-sm text-gray-600">
                {resgate.cicloPontos.nome}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 text-sm font-medium border rounded-full ${getStatusBadge(
                  resgate.status,
                )}`}
              >
                {getStatusLabel(resgate.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-600 uppercase mb-1">Pontos</p>
              <p className="text-lg font-semibold text-gray-900">
                {resgate.pontosDebitados}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase mb-1">
                Solicitado em
              </p>
              <p className="text-sm text-gray-700">
                {new Date(resgate.solicitadoEm).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase mb-1">ID</p>
              <p className="text-xs font-mono text-gray-600">
                {resgate.id.substring(0, 8)}...
              </p>
            </div>
          </div>

          {resgate.observacao && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Observação:</span>{" "}
                {resgate.observacao}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {resgate.podesCancelar && (
              <button
                onClick={() => handleCancelar(resgate.id)}
                disabled={cancelando === resgate.id}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  cancelando === resgate.id
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                }`}
              >
                {cancelando === resgate.id
                  ? "Cancelando..."
                  : "Cancelar Solicitação"}
              </button>
            )}

            {resgate.status === "ENTREGUE" && (
              <div className="flex-1 py-2 px-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-center font-medium text-sm">
                ✓ Entregue
              </div>
            )}

            {resgate.status === "REJEITADO" && (
              <div className="flex-1 py-2 px-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-center font-medium text-sm">
                ✗ Rejeitado
              </div>
            )}

            {resgate.status === "CANCELADO" && (
              <div className="flex-1 py-2 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-center font-medium text-sm">
                ✗ Cancelado
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 rounded-lg mt-6">
        <p className="font-medium mb-1">💡 Informações</p>
        <ul className="list-disc list-inside space-y-1 text-blue-600 text-xs">
          <li>
            Você pode cancelar solicitações que ainda estão em{" "}
            <strong>Solicitado</strong> ou <strong>Em Análise</strong>
          </li>
          <li>Pontos cancelados serão devolvidos ao seu saldo</li>
          <li>Após aprovação, o cancelamento não é mais possível</li>
        </ul>
      </div>
    </div>
  );
}
