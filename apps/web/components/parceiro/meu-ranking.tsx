"use client";

import { useEffect, useState } from "react";

interface RankingParceiro {
  posicao: number;
  parceiro: string;
  pontosAcumulados: number;
  euSou: boolean;
}

export function MeuRanking() {
  const [ranking, setRanking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const response = await fetch("/api/v1/parceiro/pontos/ranking");
        if (!response.ok) throw new Error("Erro ao carregar ranking");
        const data = await response.json();
        setRanking(data.ranking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">Carregando ranking...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!ranking || ranking.posicoes.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Ranking ainda não disponível</p>
      </div>
    );
  }

  const getMedalIcon = (posicao: number): string => {
    switch (posicao) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "";
    }
  };

  const getMedalColor = (posicao: number): string => {
    switch (posicao) {
      case 1:
        return "bg-yellow-50 border-yellow-200";
      case 2:
        return "bg-gray-50 border-gray-200";
      case 3:
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Minha Posição */}
      {ranking.minhaPositionNo && (
        <div
          className={`border-2 rounded-lg p-6 ${getMedalColor(ranking.minhaPositionNo)}`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {getMedalIcon(ranking.minhaPositionNo)}
              </span>
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase">
                  Minha Posição
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  #{ranking.minhaPositionNo}
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-700 mt-3">
              {ranking.meusPontos} pontos acumulados
            </p>
          </div>
        </div>
      )}

      {/* Ranking Completo */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase">
            Ranking - {ranking.ciclo.nome}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {ranking.posicoes.map((item: RankingParceiro) => (
            <div
              key={`${item.posicao}-${item.parceiro}`}
              className={`px-6 py-4 flex items-center justify-between ${
                item.euSou ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 font-semibold text-gray-700">
                  {getMedalIcon(item.posicao) ? (
                    <span className="text-xl">
                      {getMedalIcon(item.posicao)}
                    </span>
                  ) : (
                    <span>#{item.posicao}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${item.euSou ? "text-blue-900" : "text-gray-900"}`}
                  >
                    {item.parceiro} {item.euSou && "👤"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {item.pontosAcumulados}
                </p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">📊 Sobre o ranking</p>
        <ul className="list-disc list-inside space-y-1 text-blue-600 text-xs">
          <li>Ranking atualizado diariamente durante o ciclo de pontos</li>
          <li>Posição baseada no total acumulado de pontos</li>
          <li>Resgate de prêmios não afeta sua posição no ranking</li>
        </ul>
      </div>
    </div>
  );
}
