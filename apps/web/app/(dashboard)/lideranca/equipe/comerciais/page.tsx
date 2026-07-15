"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Comercial {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  funcao: string | null;
  percentualComissao: number;
  status: "ATIVO" | "INATIVO";
  totalParceiros: number;
  createdAt: string;
}

export default function LiderancaComerciaisPage() {
  const [comerciais, setComerciais] = useState<Comercial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComerciais();
  }, []);

  async function fetchComerciais() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/comerciais");
      const json = await res.json();
      setComerciais(json);
    } catch (error) {
      toast.error("Erro ao carregar comerciais");
    } finally {
      setLoading(false);
    }
  }

  function formatarData(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  function formatarCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (loading) {
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
          <div className="flex items-center gap-2">
            <Link href="/lideranca" className="text-gray-600 hover:text-gray-900">
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Comerciais da Equipe</h1>
          </div>
          <p className="text-sm text-gray-500">
            Gerencie seus {comerciais.length} comerciais
          </p>
        </div>
        <Link
          href="/lideranca/comerciais/novo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Novo Comercial
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                <th className="text-left p-2 font-medium text-gray-600">Email</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Função</th>
                <th className="text-left p-2 font-medium text-gray-600">Comissão</th>
                <th className="text-left p-2 font-medium text-gray-600">Parceiros</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {comerciais.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-900">{c.nome}</td>
                  <td className="p-2 text-gray-600">{c.email}</td>
                  <td className="p-2 text-gray-600">{formatarCpf(c.cpf)}</td>
                  <td className="p-2">
                    {c.funcao ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {c.funcao.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-600">
                    {c.percentualComissao.toFixed(2)}%
                  </td>
                  <td className="p-2 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {c.totalParceiros}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.status === "ATIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatarData(c.createdAt)}
                  </td>
                </tr>
              ))}

              {comerciais.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Nenhum comercial na equipe
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}