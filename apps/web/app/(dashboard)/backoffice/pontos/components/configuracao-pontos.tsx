"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Configuracao {
  id: string;
  valorPorPonto: string;
  tipoArredondamento: "PISO" | "TETO" | "PADRAO";
  vigenteDesde: string;
  vigenteAte?: string;
  vigente: boolean;
}

export function ConfiguracaoPontos({ data }: { data?: Configuracao[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [valorPorPonto, setValorPorPonto] = useState("");
  const [tipoArredondamento, setTipoArredondamento] = useState<"PISO" | "TETO" | "PADRAO">("PADRAO");

  const configVigente = data?.find((c) => c.vigente);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = configVigente
        ? `/api/v1/backoffice/pontos/configuracao?id=${configVigente.id}`
        : "/api/v1/backoffice/pontos/configuracao";

      const method = configVigente ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorPorPonto: parseFloat(valorPorPonto), tipoArredondamento }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Erro ao salvar configuração");
      }

      toast.success(configVigente ? "Configuração atualizada!" : "Configuração criada!");
      setValorPorPonto("");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configuração");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {configVigente ? "Editar Configuração Vigente" : "Nova Configuração"}
        </h3>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor em Reais (R$) por ponto
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valorPorPonto}
              onChange={(e) => setValorPorPonto(e.target.value)}
              placeholder="Ex: 0.50 (R$ 0,50 = 1 ponto)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Defina quanto o parceiro precisa gastar para ganhar 1 ponto
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de arredondamento
            </label>
            <select
              value={tipoArredondamento}
              onChange={(e) => setTipoArredondamento(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="PADRAO">Padrão (arredonda normal)</option>
              <option value="PISO">Piso (sempre para baixo)</option>
              <option value="TETO">Teto (sempre para cima)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Como tratar casas decimais no cálculo de pontos
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !valorPorPonto}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Salvando..." : configVigente ? "Atualizar Configuração" : "Criar Configuração"}
        </button>
      </form>

      {data && data.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Configurações</h3>
          <div className="space-y-3">
            {data.map((config) => (
              <div
                key={config.id}
                className={`border p-4 rounded-lg ${config.vigente ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${config.vigente ? "text-green-700" : "text-gray-500"}`}>
                      {config.vigente ? "● Vigente" : "○ Encerrada"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(config.vigenteDesde).toLocaleDateString("pt-BR")}
                    {config.vigenteAte && ` a ${new Date(config.vigenteAte).toLocaleDateString("pt-BR")}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <p className="text-gray-500">Valor por ponto</p>
                    <p className="font-medium text-gray-900">R$ {parseFloat(config.valorPorPonto).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Arredondamento</p>
                    <p className="font-medium text-gray-900">{config.tipoArredondamento}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

