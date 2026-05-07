"use client";

import { useState, useEffect } from "react";

interface Comissao {
  consultorId: string;
  consultorNome: string;
  consultorEmail: string;
  estabelecimentoId: string;
  estabelecimentoNome: string;
  consultasRealizadas: number;
  comissaoConsultor: number;
  comissaoEstabelecimento: number;
  subtotal: number;
}

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const carregarComissoes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/gestor/comissoes?mes=${mes}&ano=${ano}`);
      const data = await res.json();
      setComissoes(data.comissoes || []);
      setTotalMes(data.totalMes || 0);
    } catch (err) {
      console.error("Erro ao carregar comissões:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarComissoes();
  }, [mes, ano]);

  const meses = [
    { num: 1, nome: "Janeiro" },
    { num: 2, nome: "Fevereiro" },
    { num: 3, nome: "Março" },
    { num: 4, nome: "Abril" },
    { num: 5, nome: "Maio" },
    { num: 6, nome: "Junho" },
    { num: 7, nome: "Julho" },
    { num: 8, nome: "Agosto" },
    { num: 9, nome: "Setembro" },
    { num: 10, nome: "Outubro" },
    { num: 11, nome: "Novembro" },
    { num: 12, nome: "Dezembro" },
  ];

  const anosDisponiveis = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comissões</h1>
          <p className="text-gray-600">
            Acompanhe as comissões dos consultores e estabelecimentos
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {meses.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card Total */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-8 mb-6 text-white">
          <p className="text-blue-100 text-sm font-medium mb-1">
            Total de Comissões - {meses.find((m) => m.num === mes)?.nome} de{" "}
            {ano}
          </p>
          <h2 className="text-4xl font-bold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalMes / 100)}
          </h2>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : comissoes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma comissão registrada neste período
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Consultor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Estabelecimento
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Consultas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Comissão Consultor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Comissão Estab.
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comissoes.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {c.consultorNome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {c.consultorEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {c.estabelecimentoNome}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        {c.consultasRealizadas}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(c.comissaoConsultor / 100)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(c.comissaoEstabelecimento / 100)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(c.subtotal / 100)}
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
