"use client";

import { useEffect, useState } from "react";

interface Premio {
  id: string;
  nome: string;
  descricao: string;
  custoPontos: number;
  imagemUrl?: string;
  ativo: boolean;
  criadoEm: string;
}

export function GerenciadorPremios() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    custoPontos: "",
    imagemUrl: "",
  });

  useEffect(() => {
    fetchPremios();
  }, []);

  const fetchPremios = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/backoffice/pontos/premios");
      if (!response.ok) throw new Error("Erro ao carregar prêmios");
      const data = await response.json();
      setPremios(data.premios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        nome: formData.nome,
        descricao: formData.descricao,
        custoPontos: parseInt(formData.custoPontos),
        ...(formData.imagemUrl && { imagemUrl: formData.imagemUrl }),
      };

      if (editandoId) {
        const response = await fetch(
          `/api/v1/backoffice/pontos/premios?id=${editandoId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (!response.ok) {
          const data = await response.json();
          alert(`Erro: ${data.error}`);
          return;
        }
        alert("Prêmio atualizado com sucesso!");
      } else {
        const response = await fetch("/api/v1/backoffice/pontos/premios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const data = await response.json();
          alert(`Erro: ${data.error}`);
          return;
        }
        alert("Prêmio criado com sucesso!");
      }

      setFormData({ nome: "", descricao: "", custoPontos: "", imagemUrl: "" });
      setShowForm(false);
      setEditandoId(null);
      fetchPremios();
    } catch (err) {
      alert("Erro ao salvar prêmio");
    }
  };

  const handleDelete = async (premioId: string) => {
    if (!confirm("Tem certeza que deseja deletar este prêmio?")) return;

    setDeletando(premioId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/pontos/premios?id=${premioId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }
      alert("Prêmio deletado com sucesso!");
      fetchPremios();
    } catch (err) {
      alert("Erro ao deletar prêmio");
    } finally {
      setDeletando(null);
    }
  };

  const handleEdit = (premio: Premio) => {
    setFormData({
      nome: premio.nome,
      descricao: premio.descricao,
      custoPontos: premio.custoPontos.toString(),
      imagemUrl: premio.imagemUrl || "",
    });
    setEditandoId(premio.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">Carregando prêmios...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Catálogo de Prêmios</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditandoId(null);
            setFormData({
              nome: "",
              descricao: "",
              custoPontos: "",
              imagemUrl: "",
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Prêmio"}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: Notebook Dell XPS 13"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição detalhada do prêmio..."
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custo em Pontos
              </label>
              <input
                type="number"
                value={formData.custoPontos}
                onChange={(e) =>
                  setFormData({ ...formData, custoPontos: e.target.value })
                }
                placeholder="Ex: 5000"
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                value={formData.imagemUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imagemUrl: e.target.value })
                }
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {editandoId ? "Atualizar" : "Criar"} Prêmio
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditandoId(null);
              }}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      ) : premios.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Nenhum prêmio criado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {premios.map((premio) => (
            <div
              key={premio.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {premio.imagemUrl && (
                <div className="w-full h-40 bg-gray-200 overflow-hidden">
                  <img
                    src={premio.imagemUrl}
                    alt={premio.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {premio.nome}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {premio.descricao}
                  </p>
                </div>

                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 mb-1">Custo</p>
                  <p className="text-xl font-bold text-amber-900">
                    {premio.custoPontos} pontos
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(premio)}
                    className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(premio.id)}
                    disabled={deletando === premio.id}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm ${
                      deletando === premio.id
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {deletando === premio.id ? "..." : "Deletar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

