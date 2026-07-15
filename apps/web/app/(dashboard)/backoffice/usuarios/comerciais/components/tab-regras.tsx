"use client";

import type { RegrasComerciais, RegrasGestores } from "../types";
import { RegrasComerciaisForm } from "./regras-comerciais-form";
import { RegrasGestoresForm } from "./regras-gestores-form";

interface TabRegrasProps {
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  loading: boolean;
  onSaveComerciais: (data: RegrasComerciais) => void;
  onSaveGestores: (data: RegrasGestores) => void;
}

export function TabRegras({
  regrasComerciais,
  regrasGestores,
  loading,
  onSaveComerciais,
  onSaveGestores,
}: TabRegrasProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Regras: Comercial
        </h2>
        {loading || !regrasComerciais ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <RegrasComerciaisForm
            regras={regrasComerciais}
            onSave={onSaveComerciais}
          />
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Regras: Gestores
        </h2>
        {loading || !regrasGestores ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <RegrasGestoresForm
            regras={regrasGestores}
            onSave={onSaveGestores}
          />
        )}
      </div>
    </div>
  );
}
