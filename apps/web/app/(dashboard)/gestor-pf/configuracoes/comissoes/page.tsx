"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GestorPFConfig {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  percentualComissaoDefault: string;
  percentualComissaoMax: string;
}

export default function ConfiguracoesComissoesPage() {
  const [config, setConfig] = useState<GestorPFConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    percentualComissaoDefault: "",
    percentualComissaoMax: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setForm({
          nome: data.nome || "",
          percentualComissaoDefault: data.percentualComissaoDefault || "",
          percentualComissaoMax: data.percentualComissaoMax || "",
        });
      }
    } catch (e) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/v1/gestor-pf/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Erro ao salvar");
        return;
      }

      toast.success("Configurações salvas");
      fetchConfig();
    } catch (e) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações - Comissões</h1>
        <p className="text-gray-500 text-sm">
          Configure parâmetros de comissão padrão
        </p>
      </div>

      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Comissão Padrão
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % Comissão Default para Novos Parceiros
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.percentualComissaoDefault}
              onChange={(e) =>
                setForm({ ...form, percentualComissaoDefault: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor legado: usado como padrão se você ainda possui parceiros
              antigos comissionados por percentual. Após a migração para
              pontos, novos parceiros têm este campo vazio.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % Comissão Máxima Permitida
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.percentualComissaoMax}
              onChange={(e) =>
                setForm({ ...form, percentualComissaoMax: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
            <p className="text-xs text-gray-500 mt-1">
              Limite máximo que um parceiro pode receber sobre o Total Pago
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </form>
      </div>
    </div>
  );
}