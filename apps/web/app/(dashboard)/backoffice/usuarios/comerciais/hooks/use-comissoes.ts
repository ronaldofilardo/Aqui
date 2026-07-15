import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Comissao } from "../types";

export function useComissoes(comercialId: string | null) {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchComissoes(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${id}/comissoes`);
      if (res.ok) {
        const data = await res.json();
        setComissoes(data);
      }
    } catch {
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (comercialId) {
      fetchComissoes(comercialId);
    }
  }, [comercialId]);

  return { comissoes, loading, refetch: fetchComissoes };
}
