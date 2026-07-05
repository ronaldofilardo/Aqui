"use client";

import { useEffect, useState } from "react";
import { PremioInfo } from "@asa/shared";

export function CatalogoPremios() {
  const [catalogo, setCatalogo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalogo() {
      try {
        const response = await fetch("/api/v1/parceiro/pontos/premios");
        if (!response.ok) throw new Error("Erro ao carregar catálogo");
        const data = await response.json();
        setCatalogo(data.catalogo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchCatalogo();
  }, []);

  const handleSolicitarResgate = async (premioId: string) => {
    setSolicitando(premioId);
    try {
      const response = await fetch("/api/v1/parceiro/pontos/resgates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premioId }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      } else {
        alert("Resgate solicitado com sucesso!");
        // Recarregar catálogo
        const response = await fetch("/api/v1/parceiro/pontos/premios");
        const data = await response.json();
        setCatalogo(data.catalogo);
      }
    } catch (err) {
      alert("Erro ao solicitar resgate");
    } finally {
      setSolicitando(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Carregando catálogo...
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

  if (!catalogo || catalogo.premios.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Nenhum prêmio disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso se não está em período de resgate */}
      {!catalogo.emPeriodoResgate && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-700 text-sm font-medium">
            ⏰ O período de resgate ainda não foi aberto. Você pode visualizar
            os prêmios, mas não poderá solicitar ainda.
          </p>
        </div>
      )}

      {/* Saldo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-600 mb-1">Seu saldo atual</p>
        <p className="text-2xl font-bold text-blue-900">
          {catalogo.saldoAtual} pontos
        </p>
      </div>

      {/* Grade de Prêmios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalogo.premios.map((premio: any) => (
          <div
            key={premio.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Imagem */}
            {premio.imagemUrl && (
              <div className="w-full h-48 bg-gray-200 overflow-hidden">
                <img
                  src={premio.imagemUrl}
                  alt={premio.nome}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Conteúdo */}
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {premio.nome}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3">
                {premio.descricao}
              </p>

              {/* Custo em Pontos */}
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600 mb-1">Custo em pontos</p>
                <p className="text-xl font-bold text-amber-900">
                  {premio.custoPontos}
                </p>
              </div>

              {/* Botão de Resgate */}
              <button
                onClick={() => handleSolicitarResgate(premio.id)}
                disabled={
                  !catalogo.emPeriodoResgate ||
                  catalogo.saldoAtual < premio.custoPontos ||
                  solicitando === premio.id
                }
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  !catalogo.emPeriodoResgate ||
                  catalogo.saldoAtual < premio.custoPontos
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : solicitando === premio.id
                      ? "bg-blue-200 text-blue-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {solicitando === premio.id
                  ? "Processando..."
                  : catalogo.saldoAtual < premio.custoPontos
                    ? `Saldo insuficiente (${premio.custoPontos})`
                    : !catalogo.emPeriodoResgate
                      ? "Resgate fechado"
                      : "Solicitar Resgate 🎁"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
        <p className="font-medium mb-1">✨ Dica</p>
        <p className="text-green-600">
          Clique em "Solicitar Resgate" para solicitar um prêmio. Seu saldo será
          debitado imediatamente, mas a aprovação final depende do gestor.
        </p>
      </div>
    </div>
  );
}
