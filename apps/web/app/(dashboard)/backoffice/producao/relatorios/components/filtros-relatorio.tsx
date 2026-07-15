"use client";

import { formatarMes } from "../utils";

interface FiltrosRelatorioProps {
  inicio: string;
  fim: string;
  comercialId: string;
  funcao: string;
  mesesDisponiveis: string[];
  comerciais: Array<{ id: string; nome: string; funcao?: string }>;
  funcoesDisponiveis: string[];
  onInicioChange: (value: string) => void;
  onFimChange: (value: string) => void;
  onComercialIdChange: (value: string) => void;
  onFuncaoChange: (value: string) => void;
  onBuscar: () => void;
  onExportarCSV: () => void;
  loading: boolean;
}

export function FiltrosRelatorio({
  inicio,
  fim,
  comercialId,
  funcao,
  mesesDisponiveis,
  comerciais,
  funcoesDisponiveis,
  onInicioChange,
  onFimChange,
  onComercialIdChange,
  onFuncaoChange,
  onBuscar,
  onExportarCSV,
  loading,
}: FiltrosRelatorioProps) {
  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Mês Inicial</label>
          <select
            value={inicio}
            onChange={(e) => onInicioChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Selecione...</option>
            {mesesDisponiveis.map((mes) => (
              <option key={mes} value={mes}>
                {formatarMes(mes)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Mês Final</label>
          <select
            value={fim}
            onChange={(e) => onFimChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Selecione...</option>
            {mesesDisponiveis.map((mes) => (
              <option key={mes} value={mes}>
                {formatarMes(mes)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Função</label>
          <select
            value={funcao}
            onChange={(e) => onFuncaoChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todas</option>
            {funcoesDisponiveis.map((f) => (
              <option key={f} value={f}>
                {f.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Comercial</label>
          <select
            value={comercialId}
            onChange={(e) => onComercialIdChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todos</option>
            {comerciais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={onBuscar}
            disabled={loading || !inicio || !fim}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
          >
            {loading ? "Carregando..." : "Buscar"}
          </button>
          <button
            onClick={onExportarCSV}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            📄 CSV
          </button>
        </div>
      </div>
    </div>
  );
}
