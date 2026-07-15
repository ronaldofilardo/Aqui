"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Gestor {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  percentualComissao: number;
  status: "ATIVO" | "INATIVO";
  totalParceiros: number;
  createdAt: string;
}

export default function LiderancaGestoresPage() {
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGestores();
  }, []);

  async function fetchGestores() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/gestores");
      const json = await res.json();
      setGestores(json);
    } catch (error) {
      toast.error("Erro ao carregar gestores");
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
            <h1 className="text-2xl font-bold text-gray-900">Gestores da Equipe</h1>
          </div>
          <p className="text-sm text-gray-500">
            Gerencie seus {gestores.length} gestores
          </p>
        </div>
        <Link
          href="/lideranca/gestores/novo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Novo Gestor
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
                <th className="text-left p-2 font-medium text-gray-600">Comissão</th>
                <th className="text-left p-2 font-medium text-gray-600">Parceiros</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {gestores.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-900">{g.nome}</td>
                  <td className="p-2 text-gray-600">{g.email}</td>
                  <td className="p-2 text-gray-600">{formatarCpf(g.cpf)}</td>
                  <td className="p-2 text-gray-600">
                    {g.percentualComissao.toFixed(2)}%
                  </td>
                  <td className="p-2 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {g.totalParceiros}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        g.status === "ATIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {g.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatarData(g.createdAt)}
                  </td>
                </tr>
              ))}

              {gestores.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Nenhum gestor na equipe
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