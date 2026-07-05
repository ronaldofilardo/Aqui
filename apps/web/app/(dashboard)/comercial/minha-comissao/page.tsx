"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Comissao {
  id: string;
  mesReferencia: string;
  valorVendas: number;
  valorComissao: number;
  status: string;
  dataPagamento?: string | null;
}

interface Comercial {
  id: string;
  nome: string;
  funcao?: string;
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

export default function MinhaComissaoPage() {
  const [comercial, setComercial] = useState<Comercial | null>(null);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGeral, setTotalGeral] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Buscar dados do comercial
        const comRes = await fetch("/api/v1/comercial/minha-comissao");
        if (comRes.ok) {
          const comData = await comRes.json();
          setComercial(comData.comercial);
        }

        // Buscar comissões
        const res = await fetch("/api/v1/comercial/minhas-metas");
        if (res.ok) {
          // Reutilizando endpoint de metas para pegar comissões
          // Na verdade precisamos de um endpoint específico
        }

        // Buscar comissões (endpoint correto)
        const comissoesRes = await fetch("/api/v1/comercial/minha-comissao/comissoes");
        if (comissoesRes.ok) {
          const data = await comissoesRes.json();
          setComissoes(data);
          const total = data.reduce((sum: number, c: Comissao) => {
            return sum + (c.status === "PAGA" ? c.valorComissao : 0);
          }, 0);
          setTotalGeral(total);
        }
      } catch {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minha Comissão</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe suas vendas e comissões calculadas
        </p>
      </div>

      {comercial && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{comercial.nome}</h2>
              <p className="text-sm text-gray-500">
                {comercial.funcao ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    {comercial.funcao.replace(/_/g, " ").toLowerCase()}
                  </span>
                ) : (
                  "Função não definida"
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Recebido</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatBRL(totalGeral)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Histórico de Comissões
        </h2>

        {comissoes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhuma comissão calculada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-gray-700">Mês</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Vendas</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Comissão</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {comissoes.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">
                      {formatMonth(c.mesReferencia)}
                    </td>
                    <td className="p-3 text-right text-gray-600">
                      {formatBRL(c.valorVendas)}
                    </td>
                    <td className="p-3 text-right font-semibold text-primary-600">
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