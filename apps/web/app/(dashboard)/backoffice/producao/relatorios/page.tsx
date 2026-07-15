"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRelatorioComissoes } from "./hooks/use-relatorio-comissoes";
import { formatBRL, formatMonth, formatFuncao } from "./utils";
import { FiltrosRelatorio } from "./components/filtros-relatorio";

export default function RelatorioComissoesPage() {
  const {
    comissoes,
    resumo,
    loading,
    comerciais,
    mesesDisponiveis,
    fetchRelatorio,
  } = useRelatorioComissoes();

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [comercialId, setComercialId] = useState("");
  const [funcao, setFuncao] = useState("");
  const [reprocessando, setReprocessando] = useState(false);
  const [procedimentosSemComercial, setProcedimentosSemComercial] = useState<{count: number; totalVendas: number} | null>(null);

  const funcoesDisponiveis = useMemo(() => 
    Array.from(new Set(comerciais.map(c => c.funcao!).filter(Boolean))).sort(),
    [comerciais]
  );

  async function handleBuscar() {
    if (!inicio || !fim) {
      toast.error("Selecione o período inicial e final");
      return;
    }
    await fetchRelatorio({ inicio, fim, comercialId, funcao });
  }

  function handleExportarCSV() {
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

  async function handleVerificarSemComercial() {
    if (!inicio) {
      toast.error("Selecione o mês de referência");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/reprocessar-comissoes?mes=${inicio}`);
      const data = await res.json();
      setProcedimentosSemComercial({
        count: data.procedimentosSemComercial,
        totalVendas: data.totalVendasSemComissional,
      });
      if (data.procedimentosSemComercial > 0) {
        toast.info(`${data.procedimentosSemComercial} procedimento(s) sem comercial`);
      } else {
        toast.success("Todos os procedimentos já possuem comercial!");
      }
    } catch {
      toast.error("Erro ao verificar procedimentos");
    }
  }

  async function handleReprocessar() {
    if (!comercialId || !inicio) {
      toast.error("Selecione comercial e mês");
      return;
    }
    setReprocessando(true);
    try {
      const res = await fetch("/api/v1/backoffice/reprocessar-comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comercialId, mesReferencia: inicio }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao reprocessar");
        return;
      }
      const data = await res.json();
      toast.success(`${data.procedimentosVinculados} procedimentos vinculados!`);
      setProcedimentosSemComercial(null);
      handleBuscar();
    } catch {
      toast.error("Erro ao reprocessar");
    } finally {
      setReprocessando(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatório de Comissões</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe as comissões pagas e calculadas por período e comercial
        </p>
      </div>

      <FiltrosRelatorio
        inicio={inicio}
        fim={fim}
        comercialId={comercialId}
        funcao={funcao}
        mesesDisponiveis={mesesDisponiveis}
        comerciais={comerciais}
        funcoesDisponiveis={funcoesDisponiveis}
        onInicioChange={setInicio}
        onFimChange={setFim}
        onComercialIdChange={setComercialId}
        onFuncaoChange={setFuncao}
        onBuscar={handleBuscar}
        onExportarCSV={handleExportarCSV}
        loading={loading}
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : resumo ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-sm text-gray-600">Total Vendas</h3>
              <p className="text-2xl font-bold text-green-600">{formatBRL(resumo.totalGeral.totalVendas)}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600">Total Comissões</h3>
              <p className="text-2xl font-bold text-blue-600">{formatBRL(resumo.totalGeral.totalComissao)}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600">Quantidade</h3>
              <p className="text-2xl font-bold text-gray-900">{resumo.totalGeral.quantidade}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Mês</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Mês</th>
                    <th className="text-right p-2">Vendas</th>
                    <th className="text-right p-2">Comissões</th>
                    <th className="text-right p-2">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.porMes.map((m) => (
                    <tr key={m.mes} className="border-b">
                      <td className="p-2 font-medium">{formatMonth(m.mes)}</td>
                      <td className="p-2 text-right text-green-600">{formatBRL(m.totalVendas)}</td>
                      <td className="p-2 text-right text-blue-600">{formatBRL(m.totalComissao)}</td>
                      <td className="p-2 text-right">{m.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo por Função</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Função</th>
                    <th className="text-right p-2">Vendas</th>
                    <th className="text-right p-2">Comissões</th>
                    <th className="text-right p-2">Qtd</th>
                    <th className="text-right p-2">Comerciais</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.porFuncao.map((f) => (
                    <tr key={f.funcao || "-"} className="border-b">
                      <td className="p-2 font-medium">{formatFuncao(f.funcao || undefined)}</td>
                      <td className="p-2 text-right text-green-600">{formatBRL(f.totalVendas)}</td>
                      <td className="p-2 text-right text-blue-600">{formatBRL(f.totalComissao)}</td>
                      <td className="p-2 text-right">{f.quantidade}</td>
                      <td className="p-2 text-right">{f.comerciaisCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Comissões Detalhadas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Mês</th>
                    <th className="text-left p-2">Comercial</th>
                    <th className="text-left p-2">Função</th>
                    <th className="text-right p-2">Vendas</th>
                    <th className="text-right p-2">Comissão</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoes.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatMonth(c.mesReferencia)}</td>
                      <td className="p-2 font-medium">{c.comercial.nome}</td>
                      <td className="p-2">{formatFuncao(c.comercial.funcao)}</td>
                      <td className="p-2 text-right text-green-600">{formatBRL(c.valorVendas)}</td>
                      <td className="p-2 text-right text-blue-600 font-semibold">{formatBRL(c.valorComissao)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          c.status === "PAGA" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Selecione um período e clique em "Buscar" para carregar o relatório
        </div>
      )}
    </div>
  );
}
