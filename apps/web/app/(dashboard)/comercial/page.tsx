"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Parceiro {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  status: "ATIVO" | "INATIVO";
  totalIndicados: number;
  createdAt: string;
}

interface Resumo {
  totalParceiros: number;
  totalIndicados: number;
  producaoMes: number;
  comissaoMes: number;
}

export default function ComercialDashboardPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const [resParceiros, resResumo] = await Promise.all([
        fetch("/api/v1/comercial/parceiros"),
        fetch("/api/v1/comercial/resumo"),
      ]);

      const parceirosData = await resParceiros.json();
      const resumoData = await resResumo.json().catch(() => ({
        totalParceiros: parceirosData?.length || 0,
        totalIndicados: 0,
        producaoMes: 0,
        comissaoMes: 0,
      }));

      setParceiros(parceirosData);
      setResumo(resumoData);
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
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

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Comercial</h1>
        <p className="text-sm text-gray-500">
          Gerencie seus {parceiros.length} parceiros
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Parceiros</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {resumo?.totalParceiros || 0}
              </p>
            </div>
            <div className="text-3xl text-green-400">🤝</div>
          </div>
          <Link
            href="/comercial/parceiros"
            className="text-xs text-green-600 hover:underline mt-2 inline-block"
          >
            Ver todos →
          </Link>
        </div>

        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Indicados</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {resumo?.totalIndicados || 0}
              </p>
            </div>
            <div className="text-3xl text-blue-400">👥</div>
          </div>
        </div>

        <div className="card bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Produção (Mês)</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {formatarMoeda(resumo?.producaoMes || 0)}
              </p>
            </div>
            <div className="text-3xl text-gray-400">💰</div>
          </div>
        </div>

        <div className="card bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Comissão (Mês)</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {formatarMoeda(resumo?.comissaoMes || 0)}
              </p>
            </div>
            <div className="text-3xl text-yellow-400">💵</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Parceiros Recentes</h2>
          <Link
            href="/comercial/parceiros/novo"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Novo Parceiro
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Nome</th>
                <th className="text-left p-2 font-medium text-gray-600">Email</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Indicados</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {parceiros.slice(0, 10).map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-900">{p.nome}</td>
                  <td className="p-2 text-gray-600">{p.email}</td>
                  <td className="p-2 text-gray-600">{formatarCpf(p.cpf)}</td>
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
                </tr>
              ))}

              {parceiros.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum parceiro cadastrado. Comece cadastrando seu primeiro parceiro!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {parceiros.length > 10 && (
          <div className="mt-4 text-center">
            <Link
              href="/comercial/parceiros"
              className="text-sm text-green-600 hover:underline"
            >
              Ver todos os {parceiros.length} parceiros →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}