import { useEffect, useState } from "react";
import { toast } from "sonner";

export function usePontosData(activeTab: string, gestorPfId?: string) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    if (!gestorPfId) return;
    
    setLoading(true);
    try {
      const endpoint = `/api/v1/gestor-pf/pontos/${activeTab}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const tabData = await res.json();
        let value: any = tabData;
        
        if (activeTab === "ciclos") value = tabData.ciclos;
        else if (activeTab === "configuracao") value = tabData.configuracoes;
        else if (activeTab === "distribuir") {
          value = tabData.producoes;
        }
        else if (activeTab === "premios") value = tabData.premios;
        else if (activeTab === "ranking") value = tabData.ranking?.posicoes;
        else if (activeTab === "resgates") value = tabData.resgates;
        
        setData((prev: any) => ({ ...prev, [activeTab]: value }));
      }
    } catch (e) {
      toast.error(`Erro ao carregar ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [activeTab, gestorPfId]);

  return { data, loading, refetch: fetchData };
}