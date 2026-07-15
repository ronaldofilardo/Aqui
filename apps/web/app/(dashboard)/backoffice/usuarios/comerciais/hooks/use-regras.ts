import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RegrasComerciais, RegrasGestores } from "../types";

export function useRegras() {
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchRegras() {
    setLoading(true);
    try {
      const [regrasComRes, regrasGesRes] = await Promise.all([
        fetch("/api/v1/backoffice/regras-comerciais"),
        fetch("/api/v1/backoffice/regras-gestores"),
      ]);
      setRegrasComerciais(regrasComRes.ok ? await regrasComRes.json() : null);
      setRegrasGestores(regrasGesRes.ok ? await regrasGesRes.json() : null);
    } catch {
      toast.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegras();
  }, []);

  return { regrasComerciais, regrasGestores, loading, refetch: fetchRegras };
}
