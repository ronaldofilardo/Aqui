"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RegrasComerciais {
  id?: string;
  cartaoAcessoSaude: number;
  cireAtivo: number;
  cireReceptivo: number;
  franchisingAcesso: number;
  franchisingCartao: number;
  unidade: number;
}

interface RegrasGestores {
  id?: string;
  gerenteCire: number;
  supervisorAtivo: number;
  supervisorReceptivo: number;
  supervisorFranquia: number;
  supervisorAtendimento: number;
  gerenteAtendimento: number;
  supervisorComercial: number;
}

function RegrasComerciaisForm({
  regras,
  onSave,
  loading,
}: {
  regras: RegrasComerciais;
  onSave: (data: RegrasComerciais) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<RegrasComerciais>(regras);

  useEffect(() => {
    setForm(regras);
  }, [regras]);

  function handleChange(field: keyof RegrasComerciais, value: string) {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            🏥 Cartão Acesso Saúde (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.cartaoAcessoSaude}
            onChange={(e) => handleChange("cartaoAcessoSaude", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            💪 Cire Ativo (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.cireAtivo}
            onChange={(e) => handleChange("cireAtivo", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            📞 Cire Receptivo (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.cireReceptivo}
            onChange={(e) => handleChange("cireReceptivo", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            🤝 Franchising Acesso (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.franchisingAcesso}
            onChange={(e) => handleChange("franchisingAcesso", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            💳 Franchising Cartão (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.franchisingCartao}
            onChange={(e) => handleChange("franchisingCartao", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            🏢 Unidade (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.unidade}
            onChange={(e) => handleChange("unidade", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "💾 Salvar Regras Comerciais"}
      </button>
    </form>
  );
}

function RegrasGestoresForm({
  regras,
  onSave,
  loading,
}: {
  regras: RegrasGestores;
  onSave: (data: RegrasGestores) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<RegrasGestores>(regras);

  useEffect(() => {
    setForm(regras);
  }, [regras]);

  function handleChange(field: keyof RegrasGestores, value: string) {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }

  const funcoes = [
    { field: "gerenteCire", label: "🎯 Gerente Cire", color: "bg-blue-50" },
    { field: "supervisorAtivo", label: "💪 Supervisor Ativo", color: "bg-green-50" },
    { field: "supervisorReceptivo", label: "📞 Supervisor Receptivo", color: "bg-yellow-50" },
    { field: "supervisorFranquia", label: "🤝 Supervisor Franquia", color: "bg-purple-50" },
    { field: "supervisorAtendimento", label: "🛎️ Supervisor Atendimento", color: "bg-pink-50" },
    { field: "gerenteAtendimento", label: "🏨 Gerente Atendimento", color: "bg-indigo-50" },
    { field: "supervisorComercial", label: "💼 Supervisor Comercial", color: "bg-orange-50" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-3"
    >
      {funcoes.map((f) => (
        <div key={f.field} className={`p-3 rounded-lg ${f.color}`}>
          <label className="block text-xs text-gray-700 mb-1 font-medium">
            {f.label} (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form[f.field as keyof RegrasGestores]}
            onChange={(e) => handleChange(f.field as keyof RegrasGestores, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "💾 Salvar Regras Gestores"}
      </button>
    </form>
  );
}

export default function RegrasPage() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingComercial, setSavingComercial] = useState(false);
  const [savingGestor, setSavingGestor] = useState(false);

  async function fetchRegras() {
    setLoading(true);
    try {
      const [comRes, gesRes] = await Promise.all([
        fetch("/api/v1/gestor-pf/regras-comerciais"),
        fetch("/api/v1/gestor-pf/regras-gestores"),
      ]);
      setRegrasComerciais(comRes.ok ? await comRes.json() : null);
      setRegrasGestores(gesRes.ok ? await gesRes.json() : null);
    } catch {
      toast.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }

  async function saveRegrasComerciais(data: RegrasComerciais) {
    setSavingComercial(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/regras-comerciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar regras");
        return;
      }
      toast.success("✅ Regras Comerciais salvas com sucesso!");
      fetchRegras();
    } catch {
      toast.error("Erro ao salvar regras");
    } finally {
      setSavingComercial(false);
    }
  }

  async function saveRegrasGestores(data: RegrasGestores) {
    setSavingGestor(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/regras-gestores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar regras");
        return;
      }
      toast.success("✅ Regras Gestores salvas com sucesso!");
      fetchRegras();
    } catch {
      toast.error("Erro ao salvar regras");
    } finally {
      setSavingGestor(false);
    }
  }

  useEffect(() => {
    fetchRegras();
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
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Gestão de Regras de Comissão</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure os percentuais de comissão para comerciais e gestores. O cálculo é baseado na fórmula:
          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
            Valor × (Regra Comercial/100) × (Regra Gestor/100)
          </code>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regras Comerciais */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              Regras Comerciais
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Percentuais por tipo de procedimento/unidade
            </p>
          </div>
          {regrasComerciais ? (
            <RegrasComerciaisForm
              regras={regrasComerciais}
              onSave={saveRegrasComerciais}
              loading={savingComercial}
            />
          ) : (
            <p className="text-sm text-gray-500">Carregando...</p>
          )}
        </div>

        {/* Regras Gestores */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Regras Gestores
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Percentuais por função do comercial
            </p>
          </div>
          {regrasGestores ? (
            <RegrasGestoresForm
              regras={regrasGestores}
              onSave={saveRegrasGestores}
              loading={savingGestor}
            />
          ) : (
            <p className="text-sm text-gray-500">Carregando...</p>
          )}
        </div>
      </div>

      {/* Exemplo de Cálculo */}
      <div className="card mt-6 bg-gradient-to-r from-primary-50 to-blue-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          💡 Exemplo de Cálculo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Valor do Procedimento:</p>
            <p className="font-bold text-lg">R$ 1.000,00</p>
          </div>
          <div>
            <p className="text-gray-600">Regra Comercial (Unidade):</p>
            <p className="font-bold text-lg text-primary-600">5%</p>
          </div>
          <div>
            <p className="text-gray-600">Regra Gestor (Supervisor Ativo):</p>
            <p className="font-bold text-lg text-primary-600">12%</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-primary-200">
          <p className="text-gray-600 text-sm mb-2">Fórmula:</p>
          <p className="font-mono text-sm">
            R$ 1.000,00 × (5/100) × (12/100) = <span className="font-bold text-primary-600 text-lg">R$ 6,00</span>
          </p>
        </div>
      </div>
    </div>
  );
}