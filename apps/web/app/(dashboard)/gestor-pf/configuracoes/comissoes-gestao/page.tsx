"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useComerciais } from "./hooks/use-comerciais";
import { useRegras } from "./hooks/use-regras";
import type { Comercial, Meta, Comissao, RegrasComerciais, RegrasGestores, ActiveTab } from "./types";
import { formatBRL } from "./utils";
import { TabCadastro } from "./components/tab-cadastro";
import { TabRegras } from "./components/tab-regras";
import { TabComissoes } from "./components/tab-comissoes";
import { ComercialModal } from "./components/comercial-modal";

export default function ComissoesGestaoPage() {
  const { comerciais, loading, refetch: refetchComerciais, setComerciais } = useComerciais();
  const { regrasComerciais, regrasGestores, loading: loadingRegras, refetch: refetchRegras } = useRegras();
  
  const [selected, setSelected] = useState<string | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedComissoes, setSelectedComissoes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cadastro");
  const [anoReferencia] = useState(new Date().getFullYear());
  const [metasGerais, setMetasGerais] = useState<Record<string, Meta[]>>({});
  const [loadingMetasGerais, setLoadingMetasGerais] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);

  async function fetchDetail(comercialId: string) {
    setLoadingDetail(true);
    try {
      const [metasRes, comRes] = await Promise.all([
        fetch(`/api/v1/gestor-pf/comerciais/${comercialId}/metas`),
        fetch(`/api/v1/gestor-pf/comerciais/${comercialId}/comissoes`),
      ]);
      setMetas(metasRes.ok ? await metasRes.json() : []);
      setComissoes(comRes.ok ? await comRes.json() : []);
    } catch {
      toast.error("Erro ao carregar detalhes");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function fetchMetasGerais() {
    setLoadingMetasGerais(true);
    try {
      const promises = comerciais.map(async (c) => {
        const res = await fetch(`/api/v1/gestor-pf/comerciais/${c.id}/metas`);
        const metas = res.ok ? await res.json() : [];
        return { comercialId: c.id, metas };
      });
      const results = await Promise.all(promises);
      const map: Record<string, Meta[]> = {};
      results.forEach((r) => {
        map[r.comercialId] = r.metas;
      });
      setMetasGerais(map);
    } catch {
      toast.error("Erro ao carregar metas gerais");
    } finally {
      setLoadingMetasGerais(false);
    }
  }

  async function handleEditarComercial(comercialId: string) {
    const comercial = comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;
    setComercialEditando(comercial);
    setShowModal(true);
  }

  async function handleSalvarEdicao(formData: Comercial) {
    try {
      const res = await fetch(`/api/v1/gestor-pf/comerciais/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email.toLowerCase().trim(),
          cpf: formData.cpf,
          telefone: formData.telefone || undefined,
          funcao: formData.funcao || undefined,
          status: formData.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao editar comercial");
        return;
      }
      toast.success("Comercial editado com sucesso");
      setShowModal(false);
      setComercialEditando(null);
      await refetchComerciais();
    } catch {
      toast.error("Erro ao editar comercial");
    }
  }

  async function handleDeletarComercial(comercialId: string) {
    const comercial = comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;
    
    let comissoesExistentes = false;
    try {
      const res = await fetch(`/api/v1/gestor-pf/comerciais/${comercialId}/comissoes`);
      if (res.ok) {
        const data = await res.json();
        comissoesExistentes = data && data.length > 0;
      }
    } catch { /* ignora */ }
    
    const msg = comissoesExistentes
      ? `⚠️ ATENÇÃO: Este comercial pode ter comissões a receber.\n\nDeseja realmente deletar "${comercial.nome}"?`
      : `Tem certeza que deseja deletar "${comercial.nome}"?`;
    
    if (!confirm(msg)) return;
    
    try {
      const res = await fetch(`/api/v1/gestor-pf/comerciais/${comercialId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar comercial");
        return;
      }
      toast.success("Comercial deletado");
      setComerciais((prev) => prev.filter((c) => c.id !== comercialId));
      setMetasGerais((prev) => {
        const novo = { ...prev };
        delete novo[comercialId];
        return novo;
      });
      await refetchComerciais();
    } catch {
      toast.error("Erro ao deletar comercial");
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
      refetchRegras();
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
      refetchRegras();
    } catch {
      toast.error("Erro ao salvar regras");
    }
  }

  async function handlePagarComissoes() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }
    if (!confirm(`Confirmar pagamento de ${selectedComissoes.length} comissões?`)) return;

    try {
      const res = await fetch("/api/v1/gestor-pf/comissoes/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comissaoIds: selectedComissoes }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar pagamento");
        return;
      }
      const data = await res.json();
      toast.success(`✅ ${data.mensagem} - Total: ${formatBRL(data.totalPago)}`);
      setSelectedComissoes([]);
      if (selected) fetchDetail(selected);
    } catch {
      toast.error("Erro ao processar pagamento");
    }
  }

  function toggleComissao(id: string) {
    setSelectedComissoes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleTodasComissoes() {
    const calculadas = comissoes.filter((c) => c.status === "CALCULADA").map((c) => c.id!);
    setSelectedComissoes((prev) =>
      prev.length === calculadas.length ? [] : calculadas
    );
  }

  async function handleSalvarMetaGeral(comercialId: string, mes: string, valor: string) {
    const num = parseFloat(valor);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/gestor-pf/comerciais/${comercialId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta salva");
      fetchMetasGerais();
      if (selected) fetchDetail(selected);
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  useEffect(() => {
    refetchComerciais();
    refetchRegras();
  }, []);

  useEffect(() => {
    if (selected) fetchDetail(selected);
  }, [selected]);

  useEffect(() => {
    if (comerciais.length > 0 && activeTab === "cadastro") {
      fetchMetasGerais();
    }
  }, [comerciais, activeTab]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissões Gestão</h1>
        <p className="text-gray-500 text-sm">
          Configure comerciais, percentual de comissão individual e metas mensais (R$).
        </p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {(["cadastro", "regras", "comissoes"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "cadastro" && (
        <TabCadastro
          comerciais={comerciais}
          loadingMetasGerais={loadingMetasGerais}
          metasGerais={metasGerais}
          anoReferencia={anoReferencia}
          onEditarComercial={handleEditarComercial}
          onDeletarComercial={handleDeletarComercial}
          onSalvarMetaGeral={handleSalvarMetaGeral}
          onRefetch={refetchComerciais}
        />
      )}

      {activeTab === "regras" && (
        <TabRegras
          regrasComerciais={regrasComerciais}
          regrasGestores={regrasGestores}
          loading={loadingRegras}
          onSaveComerciais={saveRegrasComerciais}
          onSaveGestores={saveRegrasGestores}
        />
      )}

      {activeTab === "comissoes" && (
        <TabComissoes
          comerciais={comerciais}
          selected={selected}
          metas={metas}
          comissoes={comissoes}
          loadingDetail={loadingDetail}
          selectedComissoes={selectedComissoes}
          onSelectedChange={(id) => {
            const isComissao = id.includes("-");
            if (isComissao) {
              toggleComissao(id);
            } else {
              setSelected(id);
              setSelectedComissoes([]);
            }
          }}
          onToggleTodas={toggleTodasComissoes}
          onPagarComissoes={handlePagarComissoes}
        />
      )}

      {showModal && comercialEditando && (
        <ComercialModal
          comercial={comercialEditando}
          onSave={handleSalvarEdicao}
          onClose={() => {
            setShowModal(false);
            setComercialEditando(null);
          }}
        />
      )}
    </div>
  );
}