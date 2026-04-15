"use client";

import { useEffect, useState } from "react";

interface ExtratoItem {
  id: string;
  valorTotal: string;
  quantidadeConsultas: number;
  status: string;
  pagoEm: string | null;
  criadoEm: string;
}

export default function ExtratoPage() {
  const [extrato, setExtrato] = useState<ExtratoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/consultor/extrato")
      .then((r) => r.json())
      .then((data) => setExtrato(data.pagamentos || []))
      .finally(() => setLoading(false));
  }, []);

  const totalRecebido = extrato
    .filter((e) => e.status === "PAGO")
    .reduce((s, e) => s + Number(e.valorTotal), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Extrato de Pagamentos
      </h1>

      <div className="bg-green-50 rounded-xl border border-green-200 p-4 mb-6">
        <p className="text-sm text-green-700">Total Recebido</p>
        <p className="text-3xl font-bold text-green-800">
          R$ {totalRecebido.toFixed(2)}
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500">
                  Data Criação
                </th>
                <th className="text-left px-6 py-3 text-gray-500">Consultas</th>
                <th className="text-left px-6 py-3 text-gray-500">Valor</th>
                <th className="text-left px-6 py-3 text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-gray-500">Data Pgto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extrato.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(e.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-3">{e.quantidadeConsultas}</td>
                  <td className="px-6 py-3 font-medium">
                    R$ {Number(e.valorTotal).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === "PAGO" ? "bg-green-100 text-green-700" : e.status === "FALHOU" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {e.pagoEm
                      ? new Date(e.pagoEm).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))}
              {extrato.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Nenhum pagamento encontrado
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
