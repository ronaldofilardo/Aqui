"use client";

import { useEffect, useState } from "react";
import { ExtratoMovimentacao } from "@asa/shared";

export function ExtratoMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<ExtratoMovimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExtrato() {
      try {
        const response = await fetch(
          "/api/v1/parceiro/pontos/extrato?limit=50",
        );
        if (!response.ok) throw new Error("Erro ao carregar extrato");
        const data = await response.json();
        setMovimentacoes(data.extrato.movimentacoes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchExtrato();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">Carregando extrato...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (movimentacoes.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Nenhuma movimentação no ciclo atual</p>
      </div>
    );
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "CREDITO":
        return "bg-green-100 text-green-700 border-green-200";
      case "DEBITO":
        return "bg-red-100 text-red-700 border-red-200";
      case "ESTORNO":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getOrigemLabel = (origem: string): string => {
    const labels: Record<string, string> = {
      PRODUCAO_IMPORTADA: "Produção Importada",
      RESGATE: "Resgate de Prêmio",
      ESTORNO_RESGATE: "Estorno de Resgate",
      EXPIRACAO: "Expiração",
      AJUSTE_MANUAL: "Ajuste Manual",
    };
    return labels[origem] || origem;
  };

  const getOrigemIcon = (origem: string): string => {
    switch (origem) {
      case "PRODUCAO_IMPORTADA":
        return "📊";
      case "RESGATE":
        return "🎁";
      case "ESTORNO_RESGATE":
        return "↩️";
      case "EXPIRACAO":
        return "⏰";
      case "AJUSTE_MANUAL":
        return "✏️";
      default:
        return "📝";
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Origem
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Quantidade
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Saldo Após
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movimentacoes.map((mov) => {
              const ehCredito = mov.tipo === "CREDITO";
              return (
                <tr key={mov.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(mov.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1">
                      {getOrigemIcon(mov.origem)} {getOrigemLabel(mov.origem)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium border rounded-full ${getTipoBadge(
                        mov.tipo,
                      )}`}
                    >
                      {mov.tipo}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-medium ${
                      ehCredito ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {ehCredito ? "+" : "-"} {Math.abs(mov.quantidade)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {mov.saldoApos}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {movimentacoes.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium">
            Total de movimentações: {movimentacoes.length}
          </p>
        </div>
      )}
    </div>
  );
}
