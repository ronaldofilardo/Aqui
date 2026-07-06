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
  porFuncao: Array<{
    funcao: string | null;
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
    comerciaisCount: number;
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

function formatarMes(mes: string) {
  const [ano, mesNum] = mes.split("-");
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${meses[parseInt(mesNum) - 1]} de ${ano}`;
}

function formatFuncao(funcao?: string) {
  if (!funcao) return "-";
  // Converte "GERENTE_CIRE" para "Gerente Cire"
  return funcao
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function RelatorioComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [comercialId, setComercialId] = useState("");
  const [funcao, setFuncao] = useState("");
  const [comerciais, setComerciais] = useState<Array<{ id: string; nome: string; funcao?: string }>>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [reprocessando, setReprocessando] = useState(false);
  const [procedimentosSemComercial, setProcedimentosSemComercial] = useState<{
    count: number;
    totalVendas: number;
  } | null>(null);

  // Extrair lista única de funções
  const funcoesDisponiveis = Array.from(
    new Set(comerciais.map(c => c.funcao).filter(Boolean))
  ).sort();

  useEffect(() => {
    // Buscar comerciais para o filtro
    fetch("/api/v1/gestor-pf/comerciais")
      .then((res) => res.json())
      .then((data) => setComerciais(data))
      .catch(() => {});
    
    // Buscar meses disponíveis da API de produção
    fetch("/api/v1/gestor-pf/producao?limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.mesesDisponiveis) {
          setMesesDisponiveis(data.mesesDisponiveis.sort());
        }
      })
      .catch(() => {});
  }, []);

  async function verificarProcedimentosSemComercial() {
    if (!inicio) {
      toast.error("Selecione o mês de referência");
      return;
    }

    try {
      const res = await fetch(`/api/v1/gestor-pf/reprocessar-comissoes?mes=${inicio}`);
      const data = await res.json();
      setProcedimentosSemComercial({
        count: data.procedimentosSemComercial,
        totalVendas: data.totalVendasSemComissional,
      });
      if (data.procedimentosSemComercial > 0) {
        toast.info(
          `${data.procedimentosSemComercial} procedimento(s) sem comercial (R$ ${data.totalVendasSemComissional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`
        );
      } else if (data.procedimentosSemComercial === 0) {
        toast.success("Todos os procedimentos já possuem comercial vinculado!");
      }
    } catch (err) {
      console.error("[verificarProcedimentosSemComercial] Erro:", err);
      toast.error("Erro ao verificar procedimentos sem comercial");
    }
  }

  async function handleReprocessarComissoes() {
    if (!comercialId) {
      toast.error("Selecione um comercial para vincular");
      return;
    }

    if (!inicio) {
      toast.error("Selecione o mês de referência");
      return;
    }

    setReprocessando(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/reprocessar-comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comercialId,
          mesReferencia: inicio,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao reprocessar comissões");
        return;
      }

      const data = await res.json();
      toast.success(
        `✅ ${data.procedimentosVinculados} procedimentos vinculados - Comissão: ${formatBRL(data.valorComissao)}`
      );
      setProcedimentosSemComercial(null);
      buscarRelatorio(); // Recarrega o relatório
    } catch {
      toast.error("Erro ao reprocessar comissões");
    } finally {
      setReprocessando(false);
    }
  }

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
        ...(funcao && { funcao }),
      });
      const res = await fetch(`/api/v1/gestor-pf/relatorio-comissoes?${params}`);
      
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao buscar relatório");
        return;
      }
      
      const data = await res.json();
      
      if (!data || !data.resumo) {
        toast.error("Dados inválidos recebidos da API");
        return;
      }
      
      setComissoes(data.comissoes || []);
      setResumo(data.resumo);
      
      const quantidadeComissoes = data.comissoes?.length || 0;
      if (quantidadeComissoes > 0) {
        toast.success(`Relatório carregado! ${quantidadeComissoes} comissões encontradas.`);
      } else {
        toast.info("Nenhuma comissão encontrada no período selecionado.");
      }
    } catch (err) {
      console.error("[buscarRelatorio] Erro:", err);
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mês Inicial</label>
            <select
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
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
              onChange={(e) => setFim(e.target.value)}
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
              onChange={(e) => setFuncao(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todas as Funções</option>
              {funcoesDisponiveis.map((f) => (
                <option key={f} value={f}>
                  {formatFuncao(f)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Comercial (opcional)</label>
            <select
              value={comercialId}
              onChange={(e) => setComercialId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {comerciais
                .filter(c => !funcao || c.funcao === funcao)
                .map((c) => (
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

        {/* Alerta de procedimentos sem comercial */}
        {procedimentosSemComercial && procedimentosSemComercial.count > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  {procedimentosSemComercial.count} procedimento(s) sem comercial vinculado
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Total de vendas: {formatBRL(procedimentosSemComercial.totalVendas)}
                </p>
                <div className="flex gap-2 mt-3">
                  <select
                    value={comercialId}
                    onChange={(e) => setComercialId(e.target.value)}
                    className="text-sm border rounded px-3 py-1.5 bg-white"
                  >
                    <option value="">Selecione um comercial...</option>
                    {comerciais.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleReprocessarComissoes}
                    disabled={reprocessando || !comercialId}
                    className="text-sm bg-yellow-600 text-white px-4 py-1.5 rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {reprocessando ? "⏳ Processando..." : "🔗 Vincular ao Comercial"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={verificarProcedimentosSemComercial}
            disabled={!inicio}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            📋 Verificar procedimentos sem comercial
          </button>
        </div>
      </div>

      {/* Resumo */}
      {/* Resumo Geral */}
      {resumo && resumo.totalGeral && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm text-blue-600 font-medium">Total Vendas</p>
              <p className="text-2xl font-bold text-blue-800">{formatBRL(resumo.totalGeral.totalVendas || 0)}</p>
              <p className="text-xs text-blue-500 mt-1">{resumo.totalGeral.quantidade || 0} registros</p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm text-green-600 font-medium">Total Comissões</p>
              <p className="text-2xl font-bold text-green-800">{formatBRL(resumo.totalGeral.totalComissao || 0)}</p>
              <p className="text-xs text-green-500 mt-1">
                {resumo.totalGeral.totalVendas > 0 
                  ? `${((resumo.totalGeral.totalComissao || 0) / resumo.totalGeral.totalVendas * 100).toFixed(2)}% do total`
                  : '0%'
                }
              </p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-sm text-purple-600 font-medium">Média Mensal</p>
              <p className="text-2xl font-bold text-purple-800">
                {formatBRL((resumo.totalGeral.totalComissao || 0) / Math.max(1, resumo.porMes?.length || 1))}
              </p>
              <p className="text-xs text-purple-500 mt-1">{resumo.porMes?.length || 0} meses</p>
            </div>
          </div>

          {/* Resumo por Função */}
          {resumo.porFuncao && resumo.porFuncao.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo por Função</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumo.porFuncao.map((f, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      idx === 0 
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${
                          idx === 0 ? 'text-orange-800' : 'text-gray-700'
                        }`}>
                          {formatFuncao(f.funcao || undefined)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {f.comerciaisCount} {f.comerciaisCount === 1 ? 'comercial' : 'comerciais'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-gray-900">
                        {formatBRL(f.totalComissao || 0)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Vendas: {formatBRL(f.totalVendas || 0)} • {f.quantidade || 0} {f.quantidade === 1 ? 'lançamento' : 'lançamentos'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded font-medium">
                          {formatFuncao(c.comercial.funcao)}
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