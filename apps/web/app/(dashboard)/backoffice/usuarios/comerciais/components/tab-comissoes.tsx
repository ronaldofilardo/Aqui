"use client";

import type { Comercial, Meta, Comissao } from "../types";
import { formatCpf, formatBRL } from "../utils";

interface TabComissoesProps {
  comerciais: Comercial[];
  selected: string | null;
  metas: Meta[];
  comissoes: Comissao[];
  loadingDetail: boolean;
  selectedComissoes: string[];
  onSelectedChange: (id: string) => void;
  onToggleTodas: () => void;
  onPagarComissoes: () => void;
}

export function TabComissoes({
  comerciais,
  selected,
  metas,
  comissoes,
  loadingDetail,
  selectedComissoes,
  onSelectedChange,
  onToggleTodas,
  onPagarComissoes,
}: TabComissoesProps) {
  if (!selected) {
    return (
      <div className="card">
        <p className="text-sm text-gray-500">Selecione um comercial</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Selecione o Comercial
          </h2>
          <select
            value={selected || ""}
            onChange={(e) => {
              onSelectedChange(e.target.value);
            }}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            {comerciais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} - {formatCpf(c.cpf)}
              </option>
            ))}
          </select>

          {loadingDetail ? (
            <p className="text-sm text-gray-500 mt-4">Carregando...</p>
          ) : metas.length > 0 ? (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Metas</h3>
              <ul className="text-sm space-y-1">
                {metas.map((m) => (
                  <li key={m.id || m.mesReferencia} className="flex justify-between">
                    <span>{m.mesReferencia}</span>
                    <span className="font-medium">{formatBRL(m.valorAtingido)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4">Sem metas para este comercial.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Comissões do Comercial
            </h2>
            <button
              onClick={onPagarComissoes}
              disabled={selectedComissoes.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Pagar Selecionadas ({selectedComissoes.length})
            </button>
          </div>

          {comissoes.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma comissão calculada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">
                      <input
                        type="checkbox"
                        onChange={onToggleTodas}
                        checked={
                          selectedComissoes.length ===
                          comissoes.filter((c) => c.status === "CALCULADA").length
                        }
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left p-2">Mês</th>
                    <th className="text-left p-2">Vendas</th>
                    <th className="text-left p-2">Comissão</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoes.map((c) => (
                    <tr key={c.id || c.mesReferencia} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedComissoes.includes(c.id!)}
                          onChange={() => onSelectedChange(c.id!)}
                          disabled={c.status !== "CALCULADA"}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-2">{c.mesReferencia}</td>
                      <td className="p-2">{formatBRL(c.valorVendas)}</td>
                      <td className="p-2 font-medium">{formatBRL(c.valorComissao)}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            c.status === "PAGA"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {c.dataPagamento
                          ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
