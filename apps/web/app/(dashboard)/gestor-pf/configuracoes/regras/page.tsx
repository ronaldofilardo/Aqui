"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores } from "../comissoes-gestao/types";
import { RegrasComerciaisForm } from "@/app/(dashboard)/gestor-pf/configuracoes/comissoes-gestao/components/regras-comerciais-form";
import { RegrasGestoresForm } from "@/app/(dashboard)/gestor-pf/configuracoes/comissoes-gestao/components/regras-gestores-form";

export default function ConfiguracoesRegrasPage() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegras();
  }, []);

  async function fetchRegras() {
    setLoading(true);
    try {
      const [resComercial, resGestor] = await Promise.all([
        fetch("/api/v1/gestor-pf/regras-comerciais"),
        fetch("/api/v1/gestor-pf/regras-gestores"),
      ]);

      if (resComercial.ok) {
        const data = await resComercial.json();
        setRegrasComerciais(data);
      }

      if (resGestor.ok) {
        const data = await resGestor.json();
        setRegrasGestores(data);
      }
    } catch {
      toast.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }

  async function saveRegrasComerciais(data: RegrasComerciais) {
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
      toast.success("Regras Comerciais salvas");
      fetchRegras();
    } catch {
      toast.error("Erro ao salvar regras");
    }
  }

  async function saveRegrasGestores(data: RegrasGestores) {
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
      toast.success("Regras Gestores salvas");
      fetchRegras();
    } catch {
      toast.error("Erro ao salvar regras");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações - Regras</h1>
        <p className="text-gray-500 text-sm">
          Defina as regras de comissionamento para comerciais e gestores
        </p>
      </div>

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
              onSave={saveRegrasComerciais}
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
              onSave={saveRegrasGestores}
            />
          )}
        </div>
      </div>
    </div>
  );
}