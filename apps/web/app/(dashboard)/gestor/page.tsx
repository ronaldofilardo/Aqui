"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Resumo {
  totalConsultores: number;
  totalEstabelecimentos: number;
  cuponsMes: number;
  consultasMes: number;
}

export default function GestorDashboardPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor/resumo");
      const data = await res.json();
      setResumo(data);
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Gestor</h1>
        <p className="text-sm text-gray-500">
          Visao geral dos consultores e estabelecimentos sob sua gestao
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-green-50">
          <p className="text-xs text-gray-600 font-medium">Consultores</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {resumo?.totalConsultores || 0}
          </p>
        </div>
        <div className="card bg-blue-50">
          <p className="text-xs text-gray-600 font-medium">Estabelecimentos</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {resumo?.totalEstabelecimentos || 0}
          </p>
        </div>
        <div className="card bg-indigo-50">
          <p className="text-xs text-gray-600 font-medium">Cupons (Mes)</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {resumo?.cuponsMes || 0}
          </p>
        </div>
        <div className="card bg-purple-50">
          <p className="text-xs text-gray-600 font-medium">Consultas (Mes)</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {resumo?.consultasMes || 0}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Acoes rapidas</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/gestor/consultores"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Gerenciar Consultores
          </Link>
          <Link
            href="/gestor/importar-cupons"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Importar Cupons
          </Link>
          <Link
            href="/gestor/producao"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Ver Producao
          </Link>
        </div>
      </div>
    </div>
  );
}
