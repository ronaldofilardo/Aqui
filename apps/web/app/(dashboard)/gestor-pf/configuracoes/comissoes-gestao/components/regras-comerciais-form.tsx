"use client";

import { useState } from "react";
import type { RegrasComerciais } from "../types";

interface RegrasComerciaisFormProps {
  regras: RegrasComerciais;
  onSave: (data: RegrasComerciais) => void;
}

export function RegrasComerciaisForm({ regras, onSave }: RegrasComerciaisFormProps) {
  const [formData, setFormData] = useState<RegrasComerciais>(regras);

  function handleChange(field: keyof RegrasComerciais, value: string) {
    const num = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: num }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cartão Acesso Saúde
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cartaoAcessoSaude}
            onChange={(e) => handleChange("cartaoAcessoSaude", e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CIRE Ativo
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cireAtivo}
            onChange={(e) => handleChange("cireAtivo", e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CIRE Receptivo
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cireReceptivo}
            onChange={(e) => handleChange("cireReceptivo", e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Franchising Acesso
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.franchisingAcesso}
            onChange={(e) => handleChange("franchisingAcesso", e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Franchising Cartão
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.franchisingCartao}
            onChange={(e) => handleChange("franchisingCartao", e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unidade
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.unidade}
            onChange={(e) => handleChange("unidade", e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Salvar Regras
      </button>
    </form>
  );
}