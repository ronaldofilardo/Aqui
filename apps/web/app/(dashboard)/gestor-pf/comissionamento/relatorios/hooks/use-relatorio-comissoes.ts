import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Comissao {
  id: string;
  mesReferencia: string;
  comercial: {
    id: string;
    nome: string;
    email: string;
    funcao?: string;
  };
  valorVendas: number;
  valorComissao: number;
  status: string;
  dataPagamento?: string | null;
}

interface Resumo {
  porMes: Array<{
    mes: string;
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
  }>;
  porFuncao: Array<{
    funcao: string | null;
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
    comerciaisCount: number;
  }>;
  totalGeral: {
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
  };
}

export function useRelatorioComissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [comerciais, setComerciais] = useState<Array<{ id: string; nome: string; funcao?: string }>>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  async function fetchComerciais() {
    try {
      const res = await fetch("/api/v1/gestor-pf/comerciais");
      if (res.ok) {
        const data = await res.json();
        setComerciais(data);
      }
    } catch {
      toast.error("Erro ao carregar comerciais");
    }
  }

  async function fetchRelatorio(filters?: {
    inicio?: string;
    fim?: string;
    comercialId?: string;
    funcao?: string;
  }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.inicio) params.append("inicio", filters.inicio);
      if (filters?.fim) params.append("fim", filters.fim);
      if (filters?.comercialId) params.append("comercialId", filters.comercialId);
      if (filters?.funcao) params.append("funcao", filters.funcao);

      const res = await fetch(`/api/v1/gestor-pf/relatorios/comissoes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setComissoes(data.comissoes || []);
        setResumo(data.resumo || null);
        setMesesDisponiveis(data.meses || []);
      } else {
        toast.error("Erro ao carregar relatório");
      }
    } catch {
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComerciais();
    fetchRelatorio();
  }, []);

  return {
    comissoes,
    resumo,
    loading,
    comerciais,
    mesesDisponiveis,
    fetchRelatorio,
  };
}