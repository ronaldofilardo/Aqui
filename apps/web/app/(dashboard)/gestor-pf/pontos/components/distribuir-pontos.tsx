"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface DistribuirPontosProps {
  data?: any[];
  ciclo?: any;
}

export function DistribuirPontos({ data, ciclo }: DistribuirPontosProps) {
  const [producoes, setProducoes] = useState<any[]>([]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProducoes(data);
    }
  }, [data, ciclo]);

  const handleDistribuir = async (producaoId: string) => {
    try {
      const res = await fetch("/api/v1/gestor-pf/pontos/distribuir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producaoId }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao distribuir pontos");
        return;
      }

      toast.success(
        `${json.pontos} pontos distribuídos para ${json.parceiro.nome}!`,
      );

      const resAtualizada = await fetch("/api/v1/gestor-pf/pontos/distribuir");
      if (resAtualizada.ok) {
        const dados = await resAtualizada.json();
        setProducoes(dados.producoes || []);
      }
    } catch {
      toast.error("Erro ao distribuir pontos");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Distribuir Pontos por Produção
      </h2>

      {ciclo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Ciclo vigente:</strong> {ciclo.nome}
          </p>
        </div>
      )}

      {!producoes || producoes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma produção encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {producoes.map((producao: any) => (
            <div
              key={producao.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900">
                    {producao.paciente}
                  </span>
                  {producao.pontosDistribuidos && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                      ✓ {producao.pontosDistribuidos.pontos} pts distribuídos
                    </span>
                  )}
                  {!producao.pontosDistribuidos && producao.pontosPotenciais > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                      💰 {producao.pontosPotenciais} pts a distribuir
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-gray-600">
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Procedimento:</span>{" "}
                    <span className="truncate block">{producao.procedimento}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Parceiro:</span>{" "}
                    <span className="font-medium">{producao.parceiro?.nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>{" "}
                    <span className="font-semibold text-green-600">R$ {producao.totalPago}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>{" "}
                    {new Date(producao.dataReferencia || producao.dataProcedimento).toLocaleDateString(
                      "pt-BR",
                    )}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-3">
                {producao.pontosDistribuidos ? (
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Distribuído</span>
                    <span className="text-lg font-bold text-green-600">{producao.pontosDistribuidos.pontos} pts</span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Pontos</span>
                    <span className="text-lg font-bold text-yellow-600">{producao.pontosPotenciais || 0} pts</span>
                  </div>
                )}
                {!producao.pontosDistribuidos && (
                  <button
                    onClick={() => handleDistribuir(producao.id)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                  >
                    Distribuir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}