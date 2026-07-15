import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Comercial } from "../types";

export function useComerciais() {
  const [comerciais, setComerciais] = useState<Comercial[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchComerciais() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/comerciais");
      if (res.ok) {
        const data = await res.json();
        setComerciais(data);
        return data;
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Erro ao carregar comerciais: " + (err.error || "Status " + res.status));
      }
    } catch (e) {
      console.error("[fetchComerciais] Exceção:", e);
      toast.error("Erro ao carregar comerciais");
    } finally {
      setLoading(false);
    }
    return [];
  }

  useEffect(() => {
    fetchComerciais();
  }, []);

  return { comerciais, loading, refetch: fetchComerciais, setComerciais };
}
