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

export default function PagamentosPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComissoes, setSelectedComissoes] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("CALCULADA");
  const [filterMes, setFilterMes] = useState("");

  useEffect(() => {
    fetchComissoes();
  }, [filterStatus, filterMes]);

  async function fetchComissoes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        ...(filterMes && { mes: filterMes }),
      });
      const res = await fetch(`/api/v1/backoffice/comissoes/lista?${params}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar comissões");
      }
      const data = await res.json();
      setComissoes(data);
    } catch {
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }

  async function handlePagar() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }

    if (!confirm(`Confirmar pagamento de ${selectedComissoes.length} comissões?`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/backoffice/comissoes/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comissaoIds: selectedComissoes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar pagamento");
        return;
      }
      const data = await res.json();
      toast.success(`✅ ${data.mensagem} - Total: ${formatBRL(data.totalPago)}`);
      setSelectedComissoes([]);
      fetchComissoes();
    } catch {
      toast.error("Erro ao processar pagamento");
    }
  }

  function toggleComissao(id: string) {
    setSelectedComissoes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleTodas() {
    const calculadas = comissoes.filter((c) => c.status === "CALCULADA").map((c) => c.id!);
    setSelectedComissoes((prev) =>
      prev.length === calculadas.length ? [] : calculadas
    );
  }

  function exportarRecibo() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione comissões para exportar recibo");
      return;
    }

    const selecionadas = comissoes.filter((c) => selectedComissoes.includes(c.id!));
    const total = selecionadas.reduce((sum, c) => sum + c.valorComissao, 0);

    const conteudo = `
RECIBO DE PAGAMENTO DE COMISSÕES
================================

Data: ${new Date().toLocaleDateString("pt-BR")}

Comissões Pagas:
----------------
${selecionadas.map((c) => 
  `- ${c.comercial.nome} (${c.comercial.email})
   Mês: ${formatMonth(c.mesReferencia)}
   Vendas: ${formatBRL(c.valorVendas)}
   Comissão: ${formatBRL(c.valorComissao)}
   Status: ${c.status}
   Pagamento: ${c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : "Em processamento"}
`
).join("\n")}

TOTAL: ${formatBRL(total)}

================================
Acesso Saúde - Gestão de Comissões
    `.trim();

    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recibo-comissoes-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Recibo exportado!");
  }

  const totalSelecionado = comissoes
    .filter((c) => selectedComissoes.includes(c.id!))
    .reduce((sum, c) => sum + c.valorComissao, 0);

  const totalGeral = comissoes
    .filter((c) => c.status === "CALCULADA")
    .reduce((sum, c) => sum + c.valorComissao, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 Gestão de Pagamentos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie o pagamento de comissões dos comerciais
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium">A Pagar</p>
          <p className="text-2xl font-bold text-yellow-800">{formatBRL(totalGeral)}</p>
          <p className="text-xs text-yellow-600 mt-1">
            {comissoes.filter((c) => c.status === "CALCULADA").length} comissões
          </p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 font-medium">Selecionado</p>
          <p className="text-2xl font-bold text-green-800">{formatBRL(totalSelecionado)}</p>
          <p className="text-xs text-green-600 mt-1">
            {selectedComissoes.length} comissões
          </p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Já Pagas</p>
          <p className="text-2xl font-bold text-blue-800">
            {formatBRL(comissoes.filter((c) => c.status === "PAGA").reduce((sum, c) => sum + c.valorComissao, 0))}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {comissoes.filter((c) => c.status === "PAGA").length} comissões
          </p>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="CALCULADA">A Pagar</option>
                <option value="PAGA">Pagas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mês</label>
              <input
                type="month"
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportarRecibo}
              disabled={selectedComissoes.length === 0}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              📄 Exportar Recibo
            </button>
            <button
              onClick={handlePagar}
              disabled={selectedComissoes.length === 0}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              💰 Pagar {selectedComissoes.length} Selecionada(s)
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      comissoes.filter((c) => c.status === "CALCULADA").length > 0 &&
                      comissoes
                        .filter((c) => c.status === "CALCULADA")
                        .every((c) => selectedComissoes.includes(c.id!))
                    }
                    onChange={toggleTodas}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : comissoes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Nenhuma comissão encontrada
                  </td>
                </tr>
              ) : (
                comissoes.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {c.status === "CALCULADA" ? (
                        <input
                          type="checkbox"
                          checked={selectedComissoes.includes(c.id!)}
                          onChange={() => toggleComissao(c.id!)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="text-gray-300">✓</span>
                      )}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
