"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useComerciais } from "./hooks/use-comerciais";
import { useRegras } from "./hooks/use-regras";
import type { Comercial, Meta } from "./types";
import { formatCpf } from "./utils";
import { ComercialModal } from "./components/comercial-modal";

const mesesAno = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

export default function UsuariosComerciaisPage() {
  const { comerciais, loading, refetch: refetchComerciais, setComerciais } = useComerciais();
  const { regrasComerciais, regrasGestores, loading: loadingRegras, refetch: refetchRegras } = useRegras();
  
  const [selectedComercial, setSelectedComercial] = useState<string | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [anoReferencia] = useState(new Date().getFullYear());
  const [metasGerais, setMetasGerais] = useState<Record<string, Meta[]>>({});
  const [loadingMetasGerais, setLoadingMetasGerais] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);

  async function fetchDetail(comercialId: string) {
    setLoadingDetail(true);
    try {
      const metasRes = await fetch(`/api/v1/gestor-pf/comerciais/${comercialId}/metas`);
      setMetas(metasRes.ok ? await metasRes.json() : []);
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
          lideranca: formData.lideranca || undefined,
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
      if (selectedComercial) fetchDetail(selectedComercial);
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  useEffect(() => {
    refetchComerciais();
    refetchRegras();
  }, []);

  useEffect(() => {
    if (selectedComercial) fetchDetail(selectedComercial);
  }, [selectedComercial]);

  useEffect(() => {
    if (comerciais.length > 0) {
      fetchMetasGerais();
    }
  }, [comerciais]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários - Comerciais</h1>
        <p className="text-gray-500 text-sm">
          Cadastre e configure sua equipe Comercial, defina o percentual individual de cada um e cadastre metas mensais em R$.
        </p>
      </div>

      <NovoComercialForm onCreated={refetchComerciais} />

      <div className="card mt-6 flex-grow overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Comerciais Cadastrados - Metas Anual ({anoReferencia})
        </h2>
        {loadingMetasGerais ? (
          <p className="text-sm text-gray-500">Carregando metas...</p>
        ) : comerciais.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum comercial cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-auto flex-grow">
            <table className="w-full text-sm" style={{ minWidth: '1400px' }}>
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">Comercial</th>
                  <th className="text-left p-3 font-semibold text-gray-700 sticky left-64 bg-gray-50 z-10">Função</th>
                  <th className="text-center p-3 font-semibold text-gray-700 sticky left-[340px] bg-gray-50 z-10">Ações</th>
                  {mesesAno.map((m) => (
                    <th key={m.value} className="text-center p-2 font-semibold text-gray-700 min-w-[90px]">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comerciais.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <button
                        onClick={() => handleEditarComercial(c.id)}
                        className="text-left hover:text-primary-600 hover:underline"
                      >
                        <p className="font-medium text-gray-900">{c.nome}</p>
                        <p className="text-xs text-gray-500">{formatCpf(c.cpf)}</p>
                      </button>
                    </td>
                    <td className="p-3 sticky left-64 bg-white z-10">
                      <p className="text-xs text-gray-600">{c.funcao ? c.funcao.replace(/_/g, " ") : "-"}</p>
                      <p className="text-xs text-gray-500">{c.status}</p>
                    </td>
                    <td className="p-2 text-center sticky left-[340px] bg-white z-10">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditarComercial(c.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeletarComercial(c.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                          title="Deletar"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </td>
                    {mesesAno.map((m) => {
                      const mesRef = `${anoReferencia}-${m.value}`;
                      const meta = metasGerais[c.id]?.find(
                        (mt) => mt.mesReferencia === mesRef
                      );
                      return (
                        <td key={m.value} className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={meta ? Number(meta.valorMeta) : ""}
                            placeholder="R$"
                            className="w-full px-2 py-1 border rounded text-xs text-center focus-ring"
                            onBlur={(e) => {
                              const valor = e.target.value;
                              if (valor) {
                                handleSalvarMetaGeral(c.id, mesRef, valor);
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

function NovoComercialForm({ onCreated }: { onCreated: () => void }) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lideranca, setLideranca] = useState("");
  const [funcao, setFuncao] = useState("");
  const [loading, setLoading] = useState(false);

  const funcoesComercial = [
    "SUPERVISOR_COMERCIAL",
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
  ];

  const funcoesGestor = [
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
    "SUPERVISOR_FRANQUIA",
    "SUPERVISOR_ATENDIMENTO",
    "GERENTE_ATENDIMENTO",
    "SUPERVISOR_COMERCIAL",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/gestor-pf/comerciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cpf,
          email: email.toLowerCase().trim(),
          telefone: telefone || undefined,
          lideranca: lideranca || undefined,
          funcao: funcao || undefined,
          percentualComissao: 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar comercial");
        return;
      }

      toast.success("Comercial criado com sucesso");
      setNome("");
      setCpf("");
      setEmail("");
      setTelefone("");
      setLideranca("");
      setFuncao("");
      onCreated();
    } catch {
      toast.error("Erro ao criar comercial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Novo Comercial
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
            pattern="\d{11}"
            title="CPF deve ter 11 dígitos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Liderança
          </label>
          <select
            value={lideranca}
            onChange={(e) => {
              setLideranca(e.target.value);
              setFuncao("");
            }}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="GESTOR">Gestor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Função
          </label>
          <select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            disabled={!lideranca}
          >
            <option value="">Selecione</option>
            {lideranca === "COMERCIAL" && funcoesComercial.map((f) => (
              <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
            ))}
            {lideranca === "GESTOR" && funcoesGestor.map((f) => (
              <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Comercial"}
          </button>
        </div>
      </div>
    </form>
  );
}