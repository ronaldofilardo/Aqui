"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Comercial {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  percentualComissao: string | number;
  status: string;
  funcao?: string;
}

interface Meta {
  id?: string;
  comercialId: string;
  mesReferencia: string;
  valorMeta: string | number;
  valorAtingido: string | number;
}

interface Comissao {
  id?: string;
  comercialId: string;
  mesReferencia: string;
  valorVendas: string | number;
  valorComissao: string | number;
  status: string;
  dataPagamento?: string | null;
}

interface RegrasComerciais {
  cartaoAcessoSaude: number;
  cireAtivo: number;
  cireReceptivo: number;
  franchisingAcesso: number;
  franchisingCartao: number;
  unidade: number;
}

interface RegrasGestores {
  gerenteCire: number;
  supervisorAtivo: number;
  supervisorReceptivo: number;
  supervisorFranquia: number;
  supervisorAtendimento: number;
  gerenteAtendimento: number;
  supervisorComercial: number;
}

function formatCpf(cpf: string) {
  if (cpf.length === 11)
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return cpf;
}

function formatBRL(v: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(typeof v === "string" ? parseFloat(v) : v);
}

export default function ComissoesGestaoPage() {
  const [comerciais, setComerciais] = useState<Comercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const [metas, setMetas] = useState<Meta[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [loadingRegras, setLoadingRegras] = useState(false);

  const [selectedComissoes, setSelectedComissoes] = useState<string[]>([]);

  async function fetchComerciais() {
    console.log("[fetchComerciais] Iniciando fetch...");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/comerciais");
      console.log("[fetchComerciais] Resposta:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[fetchComerciais] Dados recebidos:", data.length, "comerciais");
        setComerciais(data);
        if (!selected && data.length > 0) setSelected(data[0].id);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[fetchComerciais] Erro:", res.status, err);
        toast.error("Erro ao carregar comerciais: " + (err.error || "Status " + res.status));
      }
    } catch (e) {
      console.error("[fetchComerciais] Exceção:", e);
      toast.error("Erro ao carregar comerciais");
    } finally {
      setLoading(false);
    }
  }

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

  async function fetchRegras() {
    setLoadingRegras(true);
    try {
      const [regrasComRes, regrasGesRes] = await Promise.all([
        fetch("/api/v1/gestor-pf/regras-comerciais"),
        fetch("/api/v1/gestor-pf/regras-gestores"),
      ]);
      setRegrasComerciais(regrasComRes.ok ? await regrasComRes.json() : null);
      setRegrasGestores(regrasGesRes.ok ? await regrasGesRes.json() : null);
    } catch {
      toast.error("Erro ao carregar regras");
    } finally {
      setLoadingRegras(false);
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

  async function handlePagarComissoes() {
    if (selectedComissoes.length === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }

    if (!confirm(`Confirmar pagamento de ${selectedComissoes.length} comissões?`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/gestor-pf/comissoes/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comissaoIds: selectedComissoes,
        }),
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

  useEffect(() => {
    fetchComerciais();
    fetchRegras();
  }, []);

useEffect(() => {
    if (selected) fetchDetail(selected);
  }, [selected]);

  async function handleNovaMeta(comercialId: string, mes: string, valor: string) {
    const num = parseFloat(valor);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/gestor-pf/comerciais/${comercialId}/metas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta salva");
      fetchDetail(comercialId);
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissões Gestão</h1>
        <p className="text-gray-500 text-sm">
          Configure comerciais, percentual de comissão individual e metas
          mensais (R$). Apenas o Gestor PF tem acesso.
        </p>
      </div>

      <NovoComercialForm onCreated={fetchComerciais} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Comerciais ({comerciais.length})
          </h2>
          {comerciais.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum comercial cadastrado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {comerciais.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c.id)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selected === c.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
<p className="font-medium text-gray-900">{c.nome}</p>
                    <p className="text-xs text-gray-500">
                      {formatCpf(c.cpf)} • {c.email}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      {c.funcao ? (
                        <>
                          <span className="font-medium">{c.funcao.replace(/_/g, " ").toLowerCase()}</span> •{" "}
                        </>
                      ) : null}
                      <span
                        className={
                          c.status === "ATIVO"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        {c.status}
                      </span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2">
          {selected ? (
            (() => {
              const c = comerciais.find((x) => x.id === selected);
              if (!c) return null;
return (
                <div className="space-y-6">
                  <MetasEditor
                    comercialId={c.id}
                    metas={metas}
                    onSave={(mes, valor) =>
                      handleNovaMeta(c.id, mes, valor)
                    }
                    reload={() => fetchDetail(c.id)}
                    loading={loadingDetail}
                  />

                  <ComissoesTabela
                    comercialId={c.id}
                    comissoes={comissoes}
                    selectedComissoes={selectedComissoes}
                    onToggleComissao={toggleComissao}
                    onToggleTodas={toggleTodasComissoes}
                    onPagar={handlePagarComissoes}
                  />
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-gray-500">
              Selecione um comercial à esquerda para gerenciar.
            </p>
)}
        </div>
      </div>

      {/* Seção de Regras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Regras: Comercial */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Regras: Comercial
          </h2>
          {loadingRegras || !regrasComerciais ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <RegrasComerciaisForm
              regras={regrasComerciais}
              onSave={saveRegrasComerciais}
            />
          )}
        </div>

        {/* Regras: Gestores */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Regras: Gestores
          </h2>
          {loadingRegras || !regrasGestores ? (
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

function NovoComercialForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [funcao, setFuncao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const funcoes = [
    { value: "GERENTE_CIRE", label: "Gerente Cire" },
    { value: "SUPERVISOR_ATIVO", label: "Supervisor Ativo" },
    { value: "SUPERVISOR_RECEPTIVO", label: "Supervisor Receptivo" },
    { value: "SUPERVISOR_FRANQUIA", label: "Supervisor Franquia" },
    { value: "SUPERVISOR_ATENDIMENTO", label: "Supervisor Atendimento" },
    { value: "GERENTE_ATENDIMENTO", label: "Gerente Atendimento" },
    { value: "SUPERVISOR_COMERCIAL", label: "Supervisor Comercial" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
const payload: any = {
        nome,
        email: email.toLowerCase().trim(),
        cpf,
        telefone: telefone || undefined,
      };
      if (funcao) {
        payload.funcao = funcao;
      }
      console.log("[NovoComercialForm] Enviando payload:", payload);
      const res = await fetch("/api/v1/gestor-pf/comerciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log("[NovoComercialForm] Resposta:", res.status, json);
      if (!res.ok) {
        toast.error(json.error || "Erro ao criar comercial");
        return;
      }
toast.success(
        `Comercial criado — senha temporária: ${json.senhaTemporaria || "(definida)"}`,
      );
      setNome("");
      setEmail("");
      setCpf("");
      setTelefone("");
      setFuncao("");
      onCreated();
    } catch (err) {
      console.error("[NovoComercialForm] Erro ao criar comercial:", err);
      toast.error("Erro ao criar comercial");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Novo Comercial
      </h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">CPF</label>
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
            placeholder="000.000.000-00"
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
<div>
          <label className="block text-xs text-gray-600 mb-1">Telefone</label>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Função</label>
          <select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          >
            <option value="">Selecione uma função</option>
            {funcoes.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-5">
          <button
            type="submit"
            disabled={salvando}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Cadastrar Comercial"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MetasEditor({
  comercialId,
  metas,
  onSave,
  reload,
  loading,
}: {
  comercialId: string;
  metas: Meta[];
  onSave: (mes: string, valor: string) => void;
  reload: () => void;
  loading: boolean;
}) {
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [valor, setValor] = useState("");

  useEffect(() => {
    setMes(
      (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })(),
    );
  }, [comercialId]);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        Metas Mensais (R$)
      </h3>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus-ring"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor da meta R$"
          className="w-40 px-3 py-2 border rounded-lg text-sm focus-ring"
        />
        <button
          onClick={() => {
            onSave(mes, valor);
            setValor("");
          }}
          className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          Salvar Meta
        </button>
        <button
          onClick={reload}
          className="text-xs text-gray-500 underline"
          disabled={loading}
        >
          atualizar
        </button>
      </div>
      {metas.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma meta cadastrada nos últimos 24 meses.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Mês</th>
                <th className="text-right p-2">Meta</th>
                <th className="text-right p-2">Atingido</th>
                <th className="text-right p-2">%</th>
              </tr>
            </thead>
            <tbody>
              {metas.map((m) => (
                <tr key={`${m.comercialId}-${m.mesReferencia}`} className="border-b">
                  <td className="p-2">{m.mesReferencia}</td>
                  <td className="p-2 text-right">
                    {formatBRL(m.valorMeta)}
                  </td>
                  <td className="p-2 text-right">
                    {formatBRL(m.valorAtingido)}
                  </td>
                  <td className="p-2 text-right">
                    {Number(m.valorMeta) > 0
                      ? `${(
                          (Number(m.valorAtingido) / Number(m.valorMeta)) *
                          100
                        ).toFixed(1)}%`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComissoesTabela({
  comercialId,
  comissoes,
  selectedComissoes,
  onToggleComissao,
  onToggleTodas,
  onPagar,
}: {
  comercialId: string;
  comissoes: Comissao[];
  selectedComissoes: string[];
  onToggleComissao: (id: string) => void;
  onToggleTodas: () => void;
  onPagar: () => void;
}) {
  const calculadas = comissoes.filter((c) => c.status === "CALCULADA");
  const todasSelecionadas = calculadas.length > 0 && calculadas.every((c) => selectedComissoes.includes(c.id!));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">
          Histórico de Comissões
        </h3>
        {calculadas.length > 0 && (
          <button
            onClick={onPagar}
            disabled={selectedComissoes.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💰 Pagar {selectedComissoes.length} selecionada(s)
          </button>
        )}
      </div>
      {comissoes.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma comissão calculada nos últimos 24 meses.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 w-8">
                  <input
                    type="checkbox"
                    checked={todasSelecionadas}
                    onChange={onToggleTodas}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={calculadas.length === 0}
                  />
                </th>
                <th className="text-left p-2">Mês</th>
                <th className="text-right p-2">Vendas</th>
                <th className="text-right p-2">Comissão</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((c) => (
                <tr key={`${comercialId}-${c.mesReferencia}`} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    {c.status === "CALCULADA" ? (
                      <input
                        type="checkbox"
                        checked={selectedComissoes.includes(c.id!)}
                        onChange={() => onToggleComissao(c.id!)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    ) : (
                      <span className="text-gray-300">✓</span>
                    )}
                  </td>
                  <td className="p-2 font-medium">{c.mesReferencia}</td>
                  <td className="p-2 text-right text-gray-600">
                    {formatBRL(c.valorVendas)}
                  </td>
                  <td className="p-2 text-right font-semibold text-primary-600">
                    {formatBRL(c.valorComissao)}
                  </td>
                  <td className="p-2">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        c.status === "PAGA"
                          ? "bg-green-100 text-green-800"
                          : c.status === "CALCULADA"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-gray-500">
                    {c.dataPagamento
                      ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RegrasComerciaisForm({
  regras,
  onSave,
}: {
  regras: RegrasComerciais;
  onSave: (data: RegrasComerciais) => void;
}) {
  const [form, setForm] = useState<RegrasComerciais>(regras);

  useEffect(() => {
    setForm(regras);
  }, [regras]);

  function handleChange(field: keyof RegrasComerciais, value: string) {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs text-gray-600 mb-1">Cartão Acesso Saúde (%)</label>
        <input
          type="number"
          step="0.01"
          value={form.cartaoAcessoSaude}
          onChange={(e) => handleChange("cartaoAcessoSaude", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Cire Ativo (%)</label>
        <input
          type="number"
          step="0.01"
          value={form.cireAtivo}
          onChange={(e) => handleChange("cireAtivo", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Cire Receptivo (%)</label>
        <input
          type="number"
          step="0.01"
          value={form.cireReceptivo}
          onChange={(e) => handleChange("cireReceptivo", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Franchising Acesso (%)</label>
        <input
          type="number"
          step="0.01"
          value={form.franchisingAcesso}
          onChange={(e) => handleChange("franchisingAcesso", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Franchising Cartão (%)</label>
        <input
          type="number"
          step="0.01"
          value={form.franchisingCartao}
          onChange={(e) => handleChange("franchisingCartao", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Unidade (%)</label>
        <input
          type="number"
          step="0.01"
          value={form.unidade}
          onChange={(e) => handleChange("unidade", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
      >
        Salvar Regras
      </button>
    </form>
  );
}

function RegrasGestoresForm({
  regras,
  onSave,
}: {
  regras: RegrasGestores;
  onSave: (data: RegrasGestores) => void;
}) {
  const [form, setForm] = useState<RegrasGestores>(regras);

  useEffect(() => {
    setForm(regras);
  }, [regras]);

  function handleChange(field: keyof RegrasGestores, value: string) {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }

  const funcoesGestores = [
    { field: "gerenteCire", label: "Gerente Cire" },
    { field: "supervisorAtivo", label: "Supervisor Ativo" },
    { field: "supervisorReceptivo", label: "Supervisor Receptivo" },
    { field: "supervisorFranquia", label: "Supervisor Franquia" },
    { field: "supervisorAtendimento", label: "Supervisor Atendimento" },
    { field: "gerenteAtendimento", label: "Gerente Atendimento" },
    { field: "supervisorComercial", label: "Supervisor Comercial" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-3"
    >
      {funcoesGestores.map((f) => (
        <div key={f.field}>
          <label className="block text-xs text-gray-600 mb-1">{f.label} (%)</label>
          <input
            type="number"
            step="0.01"
            value={form[f.field as keyof RegrasGestores]}
            onChange={(e) => handleChange(f.field as keyof RegrasGestores, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      ))}
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
      >
        Salvar Regras
      </button>
    </form>
  );
}
