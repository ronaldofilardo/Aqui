"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface EquipeResumo {
  totalComerciais: number;
  totalGestores: number;
  totalParceiros: number;
  producaoMes: number;
  comissaoMes: number;
}

export default function LiderancaDashboardPage() {
  const [resumo, setResumo] = useState<EquipeResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumo();
  }, []);

  async function fetchResumo() {
    setLoading(true);
    try {
      // Buscar equipe completa
      const resEquipe = await fetch("/api/v1/lideranca/equipe");
      const equipeData = await resEquipe.json();

      // Buscar produção do mês (endpoint a ser implementado)
      const resProducao = await fetch("/api/v1/lideranca/producao/resumo");
      const producaoData = await resProducao.json().catch(() => ({
        producaoMes: 0,
        comissaoMes: 0,
      }));

      setResumo({
        totalComerciais: equipeData.equipe?.comerciais?.length || 0,
        totalGestores: equipeData.equipe?.gestores?.length || 0,
        totalParceiros: equipeData.resumo?.totalParceiros || 0,
        producaoMes: producaoData.producaoMes || 0,
        comissaoMes: producaoData.comissaoMes || 0,
      });
    } catch (error) {
      toast.error("Erro ao carregar resumo da equipe");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard da Equipe</h1>
        <p className="text-sm text-gray-500">
          Visão geral da sua equipe de {resumo?.totalComerciais || 0} comerciais e{" "}
          {resumo?.totalGestores || 0} gestores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Comerciais</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {resumo?.totalComerciais || 0}
              </p>
            </div>
            <div className="text-3xl text-blue-400">📊</div>
          </div>
          <Link
            href="/lideranca/equipe/comerciais"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
          >
            Ver todos →
          </Link>
        </div>

        <div className="card bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Gestores</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {resumo?.totalGestores || 0}
              </p>
            </div>
            <div className="text-3xl text-purple-400">👥</div>
          </div>
          <Link
            href="/lideranca/equipe/gestores"
            className="text-xs text-purple-600 hover:underline mt-2 inline-block"
          >
            Ver todos →
          </Link>
        </div>

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
            href="/lideranca/parceiros"
            className="text-xs text-green-600 hover:underline mt-2 inline-block"
          >
            Ver todos →
          </Link>
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
          <Link
            href="/lideranca/producao"
            className="text-xs text-gray-600 hover:underline mt-2 inline-block"
          >
            Ver detalhes →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="space-y-2">
            {resumo && resumo.totalComerciais > 0 ? (
              <Link
                href="/lideranca/comerciais/novo"
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-sm">Novo Comercial</p>
                <p className="text-xs text-gray-500">
                  Adicionar novo membro à equipe comercial
                </p>
              </Link>
            ) : (
              <Link
                href="/lideranca/comerciais/novo"
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-sm">Criar Primeiro Comercial</p>
                <p className="text-xs text-gray-500">
                  Comece sua equipe comercial
                </p>
              </Link>
            )}

            {resumo && resumo.totalGestores > 0 ? (
              <Link
                href="/lideranca/gestores/novo"
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-sm">Novo Gestor</p>
                <p className="text-xs text-gray-500">
                  Adicionar novo gestor à equipe
                </p>
              </Link>
            ) : (
              <Link
                href="/lideranca/gestores/novo"
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-sm">Criar Primeiro Gestor</p>
                <p className="text-xs text-gray-500">
                  Comece sua equipe de gestores
                </p>
              </Link>
            )}

            <Link
              href="/lideranca/producao"
              className="block p-3 border rounded-lg hover:bg-gray-50"
            >
              <p className="font-medium text-sm">Upload de Produção</p>
              <p className="text-xs text-gray-500">
                Importar planilha de produção
              </p>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de Membros</span>
              <span className="text-lg font-bold">
                {(resumo?.totalComerciais || 0) + (resumo?.totalGestores || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de Parceiros</span>
              <span className="text-lg font-bold">
                {resumo?.totalParceiros || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Média de Parceiros/Membro</span>
              <span className="text-lg font-bold">
                {resumo && (resumo.totalComerciais + resumo.totalGestores) > 0
                  ? Math.round(
                      (resumo.totalParceiros || 0) /
                        (resumo.totalComerciais + resumo.totalGestores)
                    )
                  : 0}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comissão (Mês)</span>
                <span className="text-lg font-bold text-green-600">
                  {formatarMoeda(resumo?.comissaoMes || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}