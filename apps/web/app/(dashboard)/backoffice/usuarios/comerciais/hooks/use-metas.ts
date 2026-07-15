import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Meta } from "../types";

export function useMetas(comercialId: string | null) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchMetas(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${id}/metas`);
      if (res.ok) {
        const data = await res.json();
        setMetas(data);
      }
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (comercialId) {
      fetchMetas(comercialId);
    }
  }, [comercialId]);

  async function salvarMeta(comercialId: string, mes: string, valor: string) {
    const num = parseFloat(valor);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return false;
    }
    try {
      const res = await fetch(
        `/api/v1/backoffice/comerciais/${comercialId}/metas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar meta");
        return false;
      }
      toast.success("Meta salva");
      await fetchMetas(comercialId);
      return true;
    } catch {
      toast.error("Erro ao salvar meta");
      return false;
    }
  }

  return { metas, loading, salvarMeta };
}
