"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";

interface TabelaDistribuicaoProps {
  data?: any[];
  ciclo?: any;
  onDistribuir?: () => void;
}

export function TabelaDistribuicao({ data, ciclo, onDistribuir }: TabelaDistribuicaoProps) {
  const [filtroParceiro, setFiltroParceiro] = useState("");
  const [filtroIndicado, setFiltroIndicado] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const parceiros = useMemo(() => {
    if (!data) return [];
    const unique = new Map(
      data
        .filter((p: any) => p.parceiro?.nome)
        .map((p: any) => [p.parceiro.nome, p.parceiro])
    );
    return Array.from(unique.values());
  }, [data]);

  const producoesFiltradas = useMemo(() => {
    if (!data) return [];

    return data.filter((producao: any) => {
      const parceiroMatch = !filtroParceiro || producao.parceiro?.nome === filtroParceiro;
      const indicadoMatch = !filtroIndicado || 
        producao.paciente?.toLowerCase().includes(filtroIndicado.toLowerCase());
      
      const dataProc = new Date(producao.dataReferencia || producao.dataProcedimento);
      const dataInicioMatch = !filtroDataInicio || dataProc >= new Date(filtroDataInicio);
      const dataFimMatch = !filtroDataFim || dataProc <= new Date(filtroDataFim + "T23:59:59");

      return parceiroMatch && indicadoMatch && dataInicioMatch && dataFimMatch;
    });
  }, [data, filtroParceiro, filtroIndicado, filtroDataInicio, filtroDataFim]);

  const handleDistribuir = async (producaoId: string) => {
    try {
      const res = await fetch("/api/v1/backoffice/pontos/distribuir", {
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

      onDistribuir?.();
    } catch {
      toast.error("Erro ao distribuir pontos");
    }
  };

  const limparFiltros = () => {
    setFiltroParceiro("");
    setFiltroIndicado("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
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

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Indicado
            </label>
            <input
              type="text"
              value={filtroIndicado}
              onChange={(e) => setFiltroIndicado(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Parceiro
            </label>
            <select
              value={filtroParceiro}
              onChange={(e) => setFiltroParceiro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Todos</option>
              {parceiros.map((parceiro: any) => (
                <option key={parceiro.nome} value={parceiro.nome}>
                  {parceiro.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            {producoesFiltradas.length} de {data?.length || 0} produções
          </p>
          {(filtroParceiro || filtroIndicado || filtroDataInicio || filtroDataFim) && (
            <button
              onClick={limparFiltros}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {!producoesFiltradas || producoesFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma produção encontrada
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Indicado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Procedimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Parceiro
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  pts
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {producoesFiltradas.map((producao: any) => (
                <tr key={producao.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {producao.paciente}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {producao.procedimento}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {producao.parceiro?.nome}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                    R$ {producao.totalPago}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {new Date(producao.dataReferencia || producao.dataProcedimento).toLocaleDateString(
                      "pt-BR",
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {producao.pontosDistribuidos ? (
                      <span className="text-sm font-bold text-green-600">
                        {producao.pontosDistribuidos.pontos} pts
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-yellow-600">
                        {producao.pontosPotenciais || 0} pts
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {producao.pontosDistribuidos ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        Distribuído
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDistribuir(producao.id)}
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 transition"
                      >
                        Distribuir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
