"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Comissao {
  id: string;
  mesReferencia: string;
  comercial: {
    id: string;
    nome: string;
    email: string;
    funcao?: string;
  };
  valorVendas: number;
  valorComissao: number;
  status: string;
  dataPagamento?: string | null;
}

interface Resumo {
  porMes: Array<{
    mes: string;
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
  }>;
  totalGeral: {
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
  };
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(v);
}

function formatMonth(mes: string) {
  const [ano, mesNum] = mes.split("-");
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  return `${meses[parseInt(mesNum) - 1]}/${ano}`;
}

export default function RelatorioComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [comercialId, setComercialId] = useState("");
  const [comerciais, setComerciais] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    // Buscar comerciais para o filtro
    fetch("/api/v1/backoffice/comerciais")
      .then((res) => res.json())
      .then((data) => setComerciais(data))
      .catch(() => {});
  }, []);

  async function buscarRelatorio() {
    if (!inicio || !fim) {
      toast.error("Selecione o período inicial e final");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        inicio,
        fim,
        ...(comercialId && { comercialId }),
      });
      const res = await fetch(`/api/v1/backoffice/relatorio-comissoes?${params}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao buscar relatório");
        return;
      }
      const data = await res.json();
      setComissoes(data.comissoes);
      setResumo(data.resumo);
      toast.success("Relatório carregado com sucesso!");
    } catch {
      toast.error("Erro ao buscar relatório");
    } finally {
      setLoading(false);
    }
  }

  function exportarCSV() {
    const headers = ["Mês", "Comercial", "Função", "Vendas", "Comissão", "Status", "Pagamento"];
    const rows = comissoes.map((c) => [
      c.mesReferencia,
      c.comercial.nome,
      c.comercial.funcao || "-",
      c.valorVendas.toFixed(2),
      c.valorComissao.toFixed(2),
      c.status,
      c.dataPagamento || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-comissoes-${inicio}-a-${fim}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatório de Comissões</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe as comissões pagas e calculadas por período e comercial
        </p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Período Inicial</label>
            <input
              type="month"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Período Final</label>
            <input
              type="month"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Comercial (opcional)</label>
            <select
              value={comercialId}
              onChange={(e) => setComercialId(e.target.value)}
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
              onClick={buscarRelatorio}
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Buscando..." : "🔍 Buscar"}
            </button>
            {comissoes.length > 0 && (
              <button
                onClick={exportarCSV}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                📥 Exportar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-blue-600 font-medium">Total Vendas</p>
            <p className="text-2xl font-bold text-blue-800">{formatBRL(resumo.totalGeral.totalVendas)}</p>
            <p className="text-xs text-blue-500 mt-1">{resumo.totalGeral.quantidade} registros</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-green-600 font-medium">Total Comissões</p>
            <p className="text-2xl font-bold text-green-800">{formatBRL(resumo.totalGeral.totalComissao)}</p>
            <p className="text-xs text-green-500 mt-1">
              {(resumo.totalGeral.totalComissao / resumo.totalGeral.totalVendas * 100).toFixed(2)}% do total
            </p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <p className="text-sm text-purple-600 font-medium">Média Mensal</p>
            <p className="text-2xl font-bold text-purple-800">
              {formatBRL(resumo.totalGeral.totalComissao / Math.max(1, resumo.porMes.length))}
            </p>
            <p className="text-xs text-purple-500 mt-1">{resumo.porMes.length} meses</p>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Comissões por Comercial</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : comissoes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhum registro encontrado no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700">Mês</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Comercial</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Função</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Vendas</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Comissão</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {comissoes.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{formatMonth(c.mesReferencia)}</td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-gray-900">{c.comercial.nome}</p>
                        <p className="text-xs text-gray-500">{c.comercial.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {c.comercial.funcao ? (
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                          {c.comercial.funcao.replace(/_/g, " ").toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium text-gray-600">
                      {formatBRL(c.valorVendas)}
                    </td>
                    <td className="p-3 text-right font-bold text-primary-600">
                      {formatBRL(c.valorComissao)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          c.status === "PAGA"
                            ? "bg-green-100 text-green-800"
                            : c.status === "CALCULADA"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
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
  );
}
