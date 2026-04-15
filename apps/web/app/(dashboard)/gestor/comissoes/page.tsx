"use client";

import { useEffect, useState } from "react";

interface ComissaoItem {
  id: string;
  valorConsultor: string;
  valorEstabelecimento: string;
  statusPagamento: string;
  criadoEm: string;
  estabelecimento: { nomeFantasia: string };
  consultor: { usuario: { nome: string } };
}

interface ComissaoAgrupada {
  consultorId: string;
  consultorNome: string;
  totalConsultas: number;
  totalComissao: number;
  status: string;
}

interface ComissaoAgrupadaEstab {
  estabelecimentoId: string;
  estabelecimentoNome: string;
  consultorNome: string;
  totalConsultas: number;
  totalComissao: number;
  status: string;
}

interface Totais {
  totalConsultas: number;
  totalConsultores: number;
  totalEstabelecimentos: number;
}

export default function GestorComissoesPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [agrupado, setAgrupado] = useState<ComissaoAgrupada[]>([]);
  const [agrupadoEstab, setAgrupadoEstab] = useState<ComissaoAgrupadaEstab[]>(
    [],
  );
  const [totais, setTotais] = useState<Totais>({
    totalConsultas: 0,
    totalConsultores: 0,
    totalEstabelecimentos: 0,
  });
  const [comissoes, setComissoes] = useState<ComissaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/gestor/comissoes?mes=${mes}&ano=${ano}`)
      .then((r) => r.json())
      .then((data) => {
        setAgrupado(data.agrupado || []);
        setAgrupadoEstab(data.agrupadoPorEstabelecimento || []);
        setTotais(
          data.totais || {
            totalConsultas: 0,
            totalConsultores: 0,
            totalEstabelecimentos: 0,
          },
        );
        setComissoes(data.comissoes || []);
      })
      .finally(() => setLoading(false));
  }, [mes, ano]);

  function exportCSV() {
    window.open(
      `/api/v1/gestor/relatorios?tipo=comissoes&formato=csv&mes=${mes}&ano=${ano}`,
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissões</h1>
        <button
          onClick={exportCSV}
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Exportar CSV
        </button>
      </div>

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

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Consultas</p>
              <p className="text-3xl font-bold text-gray-900">
                {totais.totalConsultas}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">A Pagar Consultores</p>
              <p className="text-3xl font-bold text-blue-600">
                R$ {totais.totalConsultores.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">R$20,00 por consulta</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">
                A Pagar Estabelecimentos
              </p>
              <p className="text-3xl font-bold text-green-600">
                R$ {totais.totalEstabelecimentos.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">R$10,00 por consulta</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
            <h2 className="px-6 py-4 font-semibold text-gray-800 border-b flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              Resumo por Consultor
              <span className="text-xs font-normal text-gray-400 ml-1">
                (R$20,00/consulta)
              </span>
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Consultor
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Consultas
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Comissão Total
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agrupado.map((a) => (
                  <tr key={a.consultorId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{a.consultorNome}</td>
                    <td className="px-6 py-3">{a.totalConsultas}</td>
                    <td className="px-6 py-3">
                      R$ {a.totalComissao.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === "PAGO" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {agrupado.length === 0 && (
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

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
            <h2 className="px-6 py-4 font-semibold text-gray-800 border-b flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Resumo por Estabelecimento
              <span className="text-xs font-normal text-gray-400 ml-1">
                (R$10,00/consulta)
              </span>
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Estabelecimento
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Consultor
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Consultas
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    A Receber
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agrupadoEstab.map((a) => (
                  <tr key={a.estabelecimentoId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">
                      {a.estabelecimentoNome}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {a.consultorNome}
                    </td>
                    <td className="px-6 py-3">{a.totalConsultas}</td>
                    <td className="px-6 py-3 font-medium text-green-700">
                      R$ {a.totalComissao.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === "PAGO"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {agrupadoEstab.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      Nenhuma comissão no período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <h2 className="px-6 py-4 font-semibold text-gray-800 border-b">
              Detalhamento
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Consultor
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Estabelecimento
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Valor Consultor
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">
                    Valor Estab.
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comissoes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{c.consultor.usuario.nome}</td>
                    <td className="px-6 py-3">
                      {c.estabelecimento.nomeFantasia}
                    </td>
                    <td className="px-6 py-3">
                      R$ {Number(c.valorConsultor).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      R$ {Number(c.valorEstabelecimento).toFixed(2)}
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
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
