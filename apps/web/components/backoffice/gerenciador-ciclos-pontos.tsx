"use client";

import { useEffect, useState } from "react";

interface CicloPontos {
  id: string;
  nome: string;
  inicioAcumuloEm: string;
  fimAcumuloEm: string;
  fimResgateEm: string;
  status: string;
  processadoExpiracaoEm?: string;
}

export function GerenciadorCiclosPontos() {
  const [ciclos, setCiclos] = useState<CicloPontos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(
    null,
  );

  const [formData, setFormData] = useState({
    nome: "",
    inicioAcumuloEm: "",
    fimAcumuloEm: "",
    fimResgateEm: "",
  });

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/backoffice/pontos/ciclos");
      if (!response.ok) throw new Error("Erro ao carregar ciclos");
      const data = await response.json();
      setCiclos(data.ciclos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCiclo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/v1/backoffice/pontos/ciclos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          inicioAcumuloEm: new Date(formData.inicioAcumuloEm).toISOString(),
          fimAcumuloEm: new Date(formData.fimAcumuloEm).toISOString(),
          fimResgateEm: new Date(formData.fimResgateEm).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert("Ciclo criado com sucesso!");
      setFormData({
        nome: "",
        inicioAcumuloEm: "",
        fimAcumuloEm: "",
        fimResgateEm: "",
      });
      setShowForm(false);
      fetchCiclos();
    } catch (err) {
      alert("Erro ao criar ciclo");
    }
  };

  const handleChangeStatus = async (cicloId: string, novoStatus: string) => {
    setAtualizandoStatus(cicloId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/pontos/ciclos/${cicloId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novoStatus }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert(`Ciclo transicionado para ${novoStatus}`);
      fetchCiclos();
    } catch (err) {
      alert("Erro ao atualizar ciclo");
    } finally {
      setAtualizandoStatus(null);
    }
  };

  const getProximaTransicao = (status: string): string | null => {
    const transicoes: Record<string, string> = {
      EM_ANDAMENTO: "RESGATE_ABERTO",
      RESGATE_ABERTO: "ENCERRADO",
    };
    return transicoes[status] || null;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "EM_ANDAMENTO":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "RESGATE_ABERTO":
        return "bg-green-100 text-green-700 border-green-200";
      case "ENCERRADO":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">Carregando ciclos...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ciclos de Pontos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Ciclo"}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={handleCreateCiclo}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Ciclo
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: 1º Semestre 2026"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Início Acúmulo
              </label>
              <input
                type="datetime-local"
                value={formData.inicioAcumuloEm}
                onChange={(e) =>
                  setFormData({ ...formData, inicioAcumuloEm: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fim Acúmulo / Início Resgate
              </label>
              <input
                type="datetime-local"
                value={formData.fimAcumuloEm}
                onChange={(e) =>
                  setFormData({ ...formData, fimAcumuloEm: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fim Resgate
              </label>
              <input
                type="datetime-local"
                value={formData.fimResgateEm}
                onChange={(e) =>
                  setFormData({ ...formData, fimResgateEm: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Criar Ciclo
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Ciclos */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      ) : ciclos.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Nenhum ciclo criado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ciclos.map((ciclo) => {
            const proximaTransicao = getProximaTransicao(ciclo.status);
            return (
              <div
                key={ciclo.id}
                className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ciclo.nome}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {ciclo.id}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium border rounded-full ${getStatusColor(
                      ciclo.status,
                    )}`}
                  >
                    {ciclo.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Início Acúmulo</p>
                    <p className="font-medium text-gray-900">
                      {new Date(ciclo.inicioAcumuloEm).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Fim Acúmulo</p>
                    <p className="font-medium text-gray-900">
                      {new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Fim Resgate</p>
                    <p className="font-medium text-gray-900">
                      {new Date(ciclo.fimResgateEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {proximaTransicao && (
                  <button
                    onClick={() =>
                      handleChangeStatus(ciclo.id, proximaTransicao)
                    }
                    disabled={atualizandoStatus === ciclo.id}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      atualizandoStatus === ciclo.id
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {atualizandoStatus === ciclo.id
                      ? "Atualizando..."
                      : `Transicionar para ${proximaTransicao}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

