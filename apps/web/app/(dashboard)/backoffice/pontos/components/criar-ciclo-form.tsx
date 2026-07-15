"use client";

import { useState } from "react";
import { toast } from "sonner";

export function CriarCicloForm() {
  const [nome, setNome] = useState("");
  const [periodicidade, setPeriodicidade] = useState<"SEMESTRAL" | "ANUAL">("ANUAL");
  const [inicio, setInicio] = useState("");
  const [fimAcumulo, setFimAcumulo] = useState("");
  const [fimResgate, setFimResgate] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleCriar() {
    if (!nome || !inicio || !fimAcumulo || !fimResgate || !periodicidade) {
      toast.error("Preencha todos os campos do ciclo");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/v1/backoffice/pontos/ciclos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          periodicidade,
          inicioAcumuloEm: new Date(inicio).toISOString(),
          fimAcumuloEm: new Date(fimAcumulo).toISOString(),
          fimResgateEm: new Date(fimResgate).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao criar ciclo");
        return;
      }
      toast.success("Ciclo criado com sucesso!");
      setNome("");
      setInicio("");
      setFimAcumulo("");
      setFimResgate("");
    } catch {
      toast.error("Erro ao criar ciclo");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-6">
      <h3 className="font-semibold text-gray-900 mb-3">Criar novo ciclo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ex: 2026 - 1º Semestre" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Periodicidade</label>
          <select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="ANUAL">Anual</option>
            <option value="SEMESTRAL">Semestral</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Início</label>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Fim Acúmulo</label>
          <input type="date" value={fimAcumulo} onChange={(e) => setFimAcumulo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Fim Resgate</label>
          <input type="date" value={fimResgate} onChange={(e) => setFimResgate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>
      <button onClick={handleCriar} disabled={salvando} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
        {salvando ? "Criando..." : "Criar Ciclo"}
      </button>
    </div>
  );
}

