"use client";

import { useEffect, useState } from "react";
import { CarteiraPontos } from "@asa/shared";

export function MinhaCarteira() {
  const [carteira, setCarteira] = useState<CarteiraPontos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCarteira() {
      try {
        const response = await fetch("/api/v1/parceiro/pontos/carteira");
        if (!response.ok) throw new Error("Erro ao carregar carteira");
        const data = await response.json();
        setCarteira(data.carteira);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchCarteira();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Carregando carteira...</p>
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

  if (!carteira) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-700 text-sm font-medium">
          Nenhuma carteira disponível
        </p>
      </div>
    );
  }

  const periodoAtivo = carteira.periodoResgate
    ? "RESGATE_ABERTO"
    : "EM_ANDAMENTO";

  return (
    <div className="space-y-6">
      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-blue-600">
            SALDO DISPONÍVEL
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-900">
              {carteira.saldoAtual.toLocaleString("pt-BR")}
            </span>
            <span className="text-lg text-blue-600">pontos</span>
          </div>
        </div>
      </div>

      {/* Ciclo e Períodos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Ciclo Vigente
          </h3>
          <p className="text-lg font-medium text-gray-900">
            {carteira.cicloPontosNome}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Período de Acúmulo */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Acúmulo
            </p>
            <p className="text-sm text-gray-700">
              {new Date(carteira.periodoAcumulo.inicio).toLocaleDateString(
                "pt-BR",
              )}{" "}
              até{" "}
              {new Date(carteira.periodoAcumulo.fim).toLocaleDateString(
                "pt-BR",
              )}
            </p>
          </div>

          {/* Período de Resgate */}
          {carteira.periodoResgate && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-green-600 uppercase mb-1">
                Resgate 🎁
              </p>
              <p className="text-sm text-green-700">
                {new Date(carteira.periodoResgate.inicio).toLocaleDateString(
                  "pt-BR",
                )}{" "}
                até{" "}
                {new Date(carteira.periodoResgate.fim).toLocaleDateString(
                  "pt-BR",
                )}
              </p>
            </div>
          )}
        </div>

        {/* Status do Ciclo */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-600 uppercase mb-1">
            Status
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                periodoAtivo === "RESGATE_ABERTO"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            <p className="text-sm font-medium text-blue-900">
              {periodoAtivo === "RESGATE_ABERTO"
                ? "Período de resgate aberto ✓"
                : "Período de acúmulo em andamento"}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <p className="font-medium mb-1">💡 Informações importantes</p>
        <ul className="list-disc list-inside space-y-1 text-amber-600">
          <li>Pontos não utilizados expiram ao fim do ciclo</li>
          <li>Visualize seu extrato para acompanhar movimentações</li>
          {periodoAtivo === "RESGATE_ABERTO" && (
            <li>
              Período de resgate está aberto! Você pode solicitar prêmios agora.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
