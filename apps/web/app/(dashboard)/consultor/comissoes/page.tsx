"use client";

import { useEffect, useState } from "react";

interface ComissaoConsultor {
  id: string;
  valorConsultor: string;
  statusPagamento: string;
  criadoEm: string;
  estabelecimento: { nomeFantasia: string };
}

export default function ConsultorComissoesPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [comissoes, setComissoes] = useState<ComissaoConsultor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/consultor/comissoes?mes=${mes}&ano=${ano}`)
      .then((r) => r.json())
      .then((data) => setComissoes(data.comissoes || []))
      .finally(() => setLoading(false));
  }, [mes, ano]);

  const totalPendente = comissoes
    .filter((c) => c.statusPagamento !== "PAGO")
    .reduce((s, c) => s + Number(c.valorConsultor), 0);
  const totalPago = comissoes
    .filter((c) => c.statusPagamento === "PAGO")
    .reduce((s, c) => s + Number(c.valorConsultor), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Minhas Comissões
      </h1>

      <div className="flex gap-4 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {String(i + 1).padStart(2, "0")}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm w-24"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <p className="text-sm text-yellow-700">Pendente</p>
          <p className="text-2xl font-bold text-yellow-800">
            R$ {totalPendente.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-700">Recebido</p>
          <p className="text-2xl font-bold text-green-800">
            R$ {totalPago.toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500">Data</th>
                <th className="text-left px-6 py-3 text-gray-500">
                  Estabelecimento
                </th>
                <th className="text-left px-6 py-3 text-gray-500">Valor</th>
                <th className="text-left px-6 py-3 text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comissoes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-3">
                    {c.estabelecimento.nomeFantasia}
                  </td>
                  <td className="px-6 py-3 font-medium">
                    R$ {Number(c.valorConsultor).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.statusPagamento === "PAGO" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {c.statusPagamento}
                    </span>
                  </td>
                </tr>
              ))}
              {comissoes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Nenhuma comissão no período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
