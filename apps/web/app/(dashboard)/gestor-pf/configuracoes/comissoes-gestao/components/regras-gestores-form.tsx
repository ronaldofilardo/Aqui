"use client";

import { useState } from "react";
import type { RegrasGestores } from "../types";

interface RegrasGestoresFormProps {
  regras: RegrasGestores;
  onSave: (data: RegrasGestores) => void;
}

export function RegrasGestoresForm({ regras, onSave }: RegrasGestoresFormProps) {
  const [formData, setFormData] = useState<RegrasGestores>(regras);

  function handleChange(field: keyof RegrasGestores, value: string) {
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
        {Object.keys(formData).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData[field as keyof RegrasGestores]}
              onChange={(e) => handleChange(field as keyof RegrasGestores, e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        ))}
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