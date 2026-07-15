"use client";

import { useEffect, useState } from "react";

interface RankingItem {
  posicao: number;
  parceiro: { id: string; nome: string; cpf: string };
  pontosAcumulados: number;
}

export function RankingGestor() {
  const [ranking, setRanking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cicloPontosId, setCicloPontosId] = useState<string | null>(null);
  const [ciclos, setCiclos] = useState<any[]>([]);

  useEffect(() => {
    fetchCiclos();
  }, []);

  useEffect(() => {
    if (cicloPontosId) {
      fetchRanking(cicloPontosId);
    }
  }, [cicloPontosId]);

  const fetchCiclos = async () => {
    try {
      const response = await fetch("/api/v1/backoffice/pontos/ciclos");
      if (!response.ok) throw new Error("Erro ao carregar ciclos");
      const data = await response.json();
      setCiclos(data.ciclos);
      if (data.ciclos.length > 0) {
        setCicloPontosId(data.ciclos[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  const fetchRanking = async (cicloId: string) => {
    setLoading(true);
    try {
      const url = new URL(
        "/api/v1/backoffice/pontos/ranking",
        window.location.origin,
      );
      url.searchParams.append("cicloPontosId", cicloId);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Erro ao carregar ranking");
      const data = await response.json();
      setRanking(data.ranking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">Carregando ranking...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Ranking de Parceiros
        </h2>
      </div>

      {/* Seletor de Ciclo */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione o Ciclo
        </label>
        <select
          value={cicloPontosId || ""}
          onChange={(e) => setCicloPontosId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {ciclos.map((ciclo) => (
            <option key={ciclo.id} value={ciclo.id}>
              {ciclo.nome} - {ciclo.status}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      ) : !ranking || ranking.posicoes.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Nenhum dado de ranking disponível</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">
              {ranking.ciclo.nome}
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {ranking.posicoes.map((item: RankingItem) => (
              <div
                key={`${item.posicao}-${item.parceiro.id}`}
                className={`px-6 py-4 flex items-center justify-between border-l-4 ${
                  item.posicao === 1
                    ? "border-yellow-400"
                    : item.posicao === 2
                      ? "border-gray-400"
                      : item.posicao === 3
                        ? "border-orange-400"
                        : "border-transparent"
                } ${getMedalColor(item.posicao)}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-gray-300 font-bold text-gray-700">
                    {getMedalIcon(item.posicao) ? (
                      <span className="text-2xl">
                        {getMedalIcon(item.posicao)}
                      </span>
                    ) : (
                      <span>#{item.posicao}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {item.parceiro.nome}
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {item.parceiro.cpf}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {item.pontosAcumulados}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">pontos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">📊 Informações</p>
        <ul className="list-disc list-inside space-y-1 text-blue-600 text-xs">
          <li>
            Ranking atualizado em tempo real com base nos pontos acumulados
          </li>
          <li>Cada ciclo tem seu próprio ranking</li>
          <li>
            Resgates de prêmios não afetam a posição no ranking (debitam pontos
            mas não contam para ranking)
          </li>
        </ul>
      </div>
    </div>
  );
}

