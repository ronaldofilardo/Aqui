"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
}

interface Procedimento {
  id: string;
  dataReferencia: string;
  dataPagamento: string;
  formaPagamento: string;
  totalPago: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  valorComissao: string;
  statusComissao: string;
  parceiro: { id: string; nome: string; cpf: string } | null;
  indicado: { id: string; nome: string; cpf: string } | null;
  upload: {
    id: string;
    nomeArquivo: string;
    mesReferencia: string;
  };
}

interface ProducaoData {
  procedimentos: Procedimento[];
  parceiros: Parceiro[];
  mesesDisponiveis: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function GestorPFProducao() {
  const [data, setData] = useState<ProducaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterMes, setFilterMes] = useState("");
  const [filterParceiro, setFilterParceiro] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducao();
  }, [filterStatus, filterMes, filterParceiro, currentPage]);

  async function fetchProducao() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });
      if (filterStatus !== "TODOS") params.set("status", filterStatus);
      if (filterMes) params.set("mesReferencia", filterMes);
      if (filterParceiro) params.set("parceiroId", filterParceiro);

      const res = await fetch(`/api/v1/gestor-pf/producao?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Erro ao carregar dados de produção");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCpf(cpf: string) {
    if (!cpf || cpf.length < 11) return cpf || "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatStatus(status: string) {
    switch (status) {
      case "PAGA":
        return { label: "Pago", class: "bg-green-100 text-green-800" };
      case "CALCULADA":
        return { label: "Calculada", class: "bg-blue-100 text-blue-800" };
      case "PENDENTE":
        return { label: "Pendente", class: "bg-yellow-100 text-yellow-800" };
      default:
        return { label: status, class: "bg-gray-100 text-gray-800" };
    }
  }

  function formatMes(mes: string) {
    if (!mes) return "-";
    const [ano, mesNum] = mes.split("-");
    const date = new Date(Number(ano), Number(mesNum) - 1);
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }

  const filteredProcedimentos = (data?.procedimentos ?? []).filter((p) => {
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      return (
        p.paciente.toLowerCase().includes(search) ||
        p.procedimento.toLowerCase().includes(search) ||
        p.cpf.includes(search) ||
        p.unidade.toLowerCase().includes(search) ||
        p.formaPagamento.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalComissao = filteredProcedimentos?.reduce(
    (sum, p) => sum + Number(p.valorComissao),
    0
  ) || 0;

  const totalReceita = filteredProcedimentos?.reduce(
    (sum, p) => sum + Number(p.totalPago),
    0
  ) || 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
          <p className="text-sm text-gray-500">
            Lista corrida de todos os procedimentos com comissões
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs text-gray-500">Total Receita</p>
            <p className="text-lg font-bold text-gray-900">
              R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Comissões</p>
            <p className="text-lg font-bold text-green-600">
              R$ {totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="TODOS">Todos Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CALCULADA">Calculada</option>
            <option value="PAGA">Pago</option>
          </select>

          <select
            value={filterMes}
            onChange={(e) => {
              setFilterMes(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">Todos os Meses</option>
            {data?.mesesDisponiveis?.map((mes) => (
              <option key={mes} value={mes}>
                {formatMes(mes)}
              </option>
            ))}
          </select>

          <select
            value={filterParceiro}
            onChange={(e) => {
              setFilterParceiro(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">Todos os Parceiros</option>
            {data?.parceiros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar paciente, procedimento, CPF, unidade..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="text-sm border rounded px-3 py-2 flex-1 min-w-[250px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Data</th>
                <th className="text-left p-2 font-medium text-gray-600">Paciente</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Procedimento</th>
                <th className="text-left p-2 font-medium text-gray-600">Tipo</th>
                <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
                <th className="text-left p-2 font-medium text-gray-600">Forma Pgto</th>
                <th className="text-left p-2 font-medium text-gray-600">Parceiro</th>
                <th className="text-left p-2 font-medium text-gray-600">Mês Ref.</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-right p-2 font-medium text-gray-600">Total Pago</th>
                <th className="text-right p-2 font-medium text-gray-600">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcedimentos?.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-600">{formatDate(p.dataReferencia)}</td>
                  <td className="p-2 text-gray-900 font-medium">{p.paciente}</td>
                  <td className="p-2 text-gray-600">{formatCpf(p.cpf)}</td>
                  <td className="p-2 text-gray-600">{p.procedimento}</td>
                  <td className="p-2 text-gray-600">{p.tipoProcedimento}</td>
                  <td className="p-2 text-gray-600">{p.unidade}</td>
                  <td className="p-2 text-gray-600">{p.formaPagamento || "-"}</td>
                  <td className="p-2">
                    {p.parceiro ? (
                      <span className="text-blue-600">{p.parceiro.nome}</span>
                    ) : (
                      <span className="text-orange-500 text-xs">Sem vínculo</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-600">
                    {p.upload?.mesReferencia ? formatMes(p.upload.mesReferencia) : "-"}
                  </td>
                  <td className="p-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${formatStatus(p.statusComissao).class}`}>
                      {formatStatus(p.statusComissao).label}
                    </span>
                  </td>
                  <td className="p-2 text-right text-gray-900">
                    R$ {Number(p.totalPago).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right text-green-600 font-medium">
                    R$ {Number(p.valorComissao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {filteredProcedimentos?.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">
                    Nenhum procedimento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-500 py-1">
              {currentPage} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={currentPage === data.pagination.totalPages}
              className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}