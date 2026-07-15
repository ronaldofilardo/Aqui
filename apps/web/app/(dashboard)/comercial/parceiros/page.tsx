"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Parceiro {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  pixChave: string | null;
  status: "ATIVO" | "INATIVO";
  totalIndicados: number;
  createdAt: string;
}

export default function ComercialParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    fetchParceiros();
  }, [filtroStatus]);

  async function fetchParceiros() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus) params.set("status", filtroStatus);

      const res = await fetch(`/api/v1/comercial/parceiros?${params}`);
      const json = await res.json();
      setParceiros(json);
    } catch (error) {
      toast.error("Erro ao carregar parceiros");
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
          <h1 className="text-2xl font-bold text-gray-900">Meus Parceiros</h1>
          <p className="text-sm text-gray-500">
            Gerencie seus {parceiros.length} parceiros
          </p>
        </div>
        <Link
          href="/comercial/parceiros/novo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Novo Parceiro
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">Todos os Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                <th className="text-left p-2 font-medium text-gray-600">Email</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">PIX</th>
                <th className="text-left p-2 font-medium text-gray-600">Indicados</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
                <th className="text-left p-2 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parceiros.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-900">{p.nome}</td>
                  <td className="p-2 text-gray-600">{p.email}</td>
                  <td className="p-2 text-gray-600">{formatarCpf(p.cpf)}</td>
                  <td className="p-2 text-gray-600">
                    {p.pixChave ? (
                      <span className="text-xs" title={p.pixChave}>
                        {p.pixChave.substring(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {p.totalIndicados}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "ATIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatarData(p.createdAt)}
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/comercial/parceiros/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}

              {parceiros.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Nenhum parceiro encontrado
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