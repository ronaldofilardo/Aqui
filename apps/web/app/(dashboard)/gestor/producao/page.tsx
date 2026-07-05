"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Cupom {
  id: string;
  cupomConfig: { codigoCupom: string };
  pacienteNome: string;
  pacienteCpf: string | null;
  servico: string;
  precoOriginal: string;
  descontoPercentual: string;
  precoFinal: string;
  status: string;
  mesReferencia: number;
  anoReferencia: number;
  criadoEm: string;
  usadoEm: string | null;
  consulta: {
    id: string;
    dataAgendamento: string | null;
    dataRealizacao: string | null;
    status: string;
    valorPago: string | null;
  } | null;
}

interface ProducaoData {
  cupons: Cupom[];
  mesesDisponiveis: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function GestorProducao() {
  const [data, setData] = useState<ProducaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterMes, setFilterMes] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducao();
  }, [filterStatus, filterMes, currentPage]);

  async function fetchProducao() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        page: currentPage.toString(),
        limit: "30",
      });
      if (filterMes) params.set("mesReferencia", filterMes);

      const res = await fetch(`/api/v1/gestor/producao?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Erro ao carregar dados de produção");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCpf(cpf: string | null) {
    if (!cpf) return "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatStatus(status: string) {
    switch (status) {
      case "DISPONIVEL":
        return { label: "Disponível", class: "bg-blue-100 text-blue-800" };
      case "UTILIZADO":
        return { label: "Utilizado", class: "bg-green-100 text-green-800" };
      case "VENCIDO":
        return { label: "Vencido", class: "bg-red-100 text-red-800" };
      case "CANCELADO":
        return { label: "Cancelado", class: "bg-gray-100 text-gray-800" };
      default:
        return { label: status, class: "bg-gray-100 text-gray-800" };
    }
  }

  function formatMes(mes: number, ano: number) {
    const date = new Date(ano, mes - 1);
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }

  function formatStatusConsulta(status: string) {
    switch (status) {
      case "AGENDADO":
        return { label: "Agendado", class: "bg-blue-100 text-blue-800" };
      case "REALIZADO":
        return { label: "Realizado", class: "bg-green-100 text-green-800" };
      case "CANCELADO":
        return { label: "Cancelado", class: "bg-red-100 text-red-800" };
      default:
        return { label: status, class: "bg-gray-100 text-gray-800" };
    }
  }

  const filteredCupons = (data?.cupons ?? []).filter((c) => {
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      return (
        c.pacienteNome.toLowerCase().includes(search) ||
        c.pacienteCpf?.includes(search) ||
        c.servico.toLowerCase().includes(search) ||
        c.cupomConfig.codigoCupom.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
          <p className="text-sm text-gray-500">
            Gerencie os cupons importados e consultas
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total de Cupons</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.pagination.total || 0}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="UTILIZADO">Utilizado</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
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
            {data?.mesesDisponiveis.map((mes) => {
              const [ano, mesNum] = mes.split("-");
              return (
                <option key={mes} value={mes}>
                  {formatMes(parseInt(mesNum), parseInt(ano))}
                </option>
              );
            })}
          </select>

          <input
            type="text"
            placeholder="Buscar paciente, CPF, cupom..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="text-sm border rounded px-3 py-2 flex-1 min-w-[200px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">
                  Cupom
                </th>
                <th className="text-left p-2 font-medium text-gray-600">
                  Paciente
                </th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">
                  Serviço
                </th>
                <th className="text-left p-2 font-medium text-gray-600">
                  Mês Ref.
                </th>
                <th className="text-left p-2 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left p-2 font-medium text-gray-600">
                  Consulta
                </th>
                <th className="text-right p-2 font-medium text-gray-600">
                  Preço Original
                </th>
                <th className="text-right p-2 font-medium text-gray-600">
                  Preço Final
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCupons?.map((cupom) => (
                <tr key={cupom.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-900 font-medium">
                    {cupom.cupomConfig.codigoCupom}
                  </td>
                  <td className="p-2 text-gray-900">{cupom.pacienteNome}</td>
                  <td className="p-2 text-gray-600">
                    {formatCpf(cupom.pacienteCpf)}
                  </td>
                  <td className="p-2 text-gray-600">{cupom.servico}</td>
                  <td className="p-2 text-gray-600">
                    {formatMes(cupom.mesReferencia, cupom.anoReferencia)}
                  </td>
                  <td className="p-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        formatStatus(cupom.status).class
                      }`}
                    >
                      {formatStatus(cupom.status).label}
                    </span>
                  </td>
                  <td className="p-2">
                    {cupom.consulta ? (
                      <div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            formatStatusConsulta(cupom.consulta.status).class
                          }`}
                        >
                          {formatStatusConsulta(cupom.consulta.status).label}
                        </span>
                        {cupom.consulta.dataRealizacao && (
                          <p className="text-xs text-gray-500 mt-1">
                            em {formatDate(cupom.consulta.dataRealizacao)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2 text-right text-gray-600">
                    R${" "}
                    {Number(cupom.precoOriginal).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-2 text-right text-gray-900 font-medium">
                    R${" "}
                    {Number(cupom.precoFinal).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}

              {filteredCupons?.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    Nenhum cupom encontrado
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
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(data.pagination.totalPages, p + 1)
                )
              }
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