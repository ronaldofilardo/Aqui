"use client";

import { useEffect, useState } from "react";

interface Estabelecimento {
  id: string;
  nomeFantasia: string;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  pixChave?: string | null;
  pixTipo?: string | null;
  bancoNome?: string | null;
  agencia?: string | null;
  conta?: string | null;
  cupomConfig: { codigoCupom: string } | null;
  documentos: Array<{ id: string; tipo: string; nomeOriginal: string }>;
  _count: { comissoes: number; usuarios: number };
}

export default function EstabelecimentosPage() {
  const [estabs, setEstabs] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nomeFantasia: "",
    razaoSocial: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    telefone: "",
    email: "",
    responsavelNome: "",
    responsavelCpf: "",
    pixTipo: "",
    pixChave: "",
    bancoNome: "",
    agencia: "",
    conta: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [conviteModal, setConviteModal] = useState<{
    estabId: string;
    nomeFantasia: string;
    link: string;
  } | null>(null);
  const [gerandoConvite, setGerandoConvite] = useState<string | null>(null);
  const [copiadoConvite, setCopiadoConvite] = useState(false);

  const loadEstabs = () => {
    fetch("/api/v1/consultor/estabelecimentos")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEstabs(data);
        } else {
          setEstabs([]);
        }
      })
      .catch(() => setEstabs([]))
      .finally(() => setLoading(false));
  };

  function formatCNPJ(value: string): string {
    const d = value.replace(/\D/g, "").slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function validarCNPJ(cnpj: string): boolean {
    const d = cnpj.replace(/\D/g, "");
    if (d.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(d)) return false;
    const calc = (len: number): number => {
      let sum = 0;
      let pos = len - 7;
      for (let i = len; i >= 1; i--) {
        sum += parseInt(d[len - i]) * pos--;
        if (pos < 2) pos = 9;
      }
      return sum % 11 < 2 ? 0 : 11 - (sum % 11);
    };
    return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
  }

  function validarChavePix(): boolean {
    if (!form.pixChave || !form.pixTipo) return true;
    const chave = form.pixChave.replace(/\D/g, "");
    if (form.pixTipo === "CPF") {
      const d = chave;
      if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
      const calc = (len: number): number => {
        let sum = 0;
        let pos = len + 1;
        for (let i = 0; i < len; i++) {
          sum += parseInt(d[i]) * pos--;
        }
        return sum % 11 < 2 ? 0 : 11 - (sum % 11);
      };
      return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
    }
    if (form.pixTipo === "CNPJ") {
      const d = chave;
      if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
      const calc = (len: number): number => {
        let sum = 0;
        let pos = len - 7;
        for (let i = len; i >= 1; i--) {
          sum += parseInt(d[len - i]) * pos--;
          if (pos < 2) pos = 9;
        }
        return sum % 11 < 2 ? 0 : 11 - (sum % 11);
      };
      return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
    }
    if (form.pixTipo === "EMAIL") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.pixChave);
    }
    if (form.pixTipo === "TELEFONE") {
      return chave.length >= 10;
    }
    return true;
  }

  useEffect(() => {
    loadEstabs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!form.nomeFantasia.trim()) {
      errors.nomeFantasia = "Nome fantasia é obrigatório";
    }

    const digits = form.cnpj.replace(/\D/g, "");
    if (digits.length > 0 && !validarCNPJ(form.cnpj)) {
      errors.cnpj = "CNPJ inválido";
    }

    if (form.pixChave && form.pixTipo && !validarChavePix()) {
      errors.pixChave = "Chave PIX inválida para o tipo selecionado";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setMsg("");
    const res = await fetch("/api/v1/consultor/estabelecimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg(
        "Estabelecimento cadastrado! Clique em 'Gerar Acesso' para criar o link de cadastro de senha.",
      );
      setForm({
        nomeFantasia: "",
        razaoSocial: "",
        cnpj: "",
        endereco: "",
        cidade: "",
        estado: "",
        telefone: "",
        email: "",
        responsavelNome: "",
        responsavelCpf: "",
        pixTipo: "",
        pixChave: "",
        bancoNome: "",
        agencia: "",
        conta: "",
      });
      setShowForm(false);
      loadEstabs();
    } else {
      const err = await res.json();
      if (err.error && err.error.includes("CNPJ")) {
        setFieldErrors({ cnpj: err.error });
      } else {
        setMsg(err.error || "Erro ao cadastrar");
      }
    }
    setSubmitting(false);
  }

  async function handleUpload(estabId: string, file: File, tipo: string) {
    setUploadingId(estabId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", tipo);

    const res = await fetch(
      `/api/v1/consultor/estabelecimentos/${estabId}/documentos`,
      {
        method: "POST",
        body: formData,
      },
    );
    if (res.ok) {
      setMsg("Documento enviado!");
      loadEstabs();
    } else {
      const err = await res.json();
      setMsg(err.error || "Erro no upload");
    }
    setUploadingId(null);
  }

  async function gerarConvite(estabId: string, nomeFantasia: string) {
    setGerandoConvite(estabId);
    const res = await fetch(
      `/api/v1/consultor/estabelecimentos/${estabId}/gerar-acesso`,
      { method: "POST" },
    );
    if (res.ok) {
      const data = await res.json();
      setConviteModal({ estabId, nomeFantasia, link: data.link });
      setCopiadoConvite(false);
    } else {
      setMsg("Erro ao gerar link de acesso");
    }
    setGerandoConvite(null);
  }

  async function copiarLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiadoConvite(true);
      setTimeout(() => setCopiadoConvite(false), 3000);
    } catch {
      // fallback: seleciona o texto
      const el = document.querySelector<HTMLInputElement>(
        "#convite-link-input",
      );
      el?.select();
    }
  }

  async function downloadQR(estabId: string) {
    const res = await fetch(
      `/api/v1/consultor/estabelecimentos/${estabId}/qrcode`,
    );
    if (res.ok) {
      const data = await res.json();
      const link = document.createElement("a");
      link.href = data.qrCode;
      link.download = `qrcode-${data.codigoCupom}.png`;
      link.click();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Meus Estabelecimentos
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Estabelecimento"}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes("sucesso") || msg.includes("cadastrado") || msg.includes("enviado") || msg.includes("atribuído") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {msg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Fantasia *
            </label>
            <input
              type="text"
              required
              value={form.nomeFantasia}
              onChange={(e) =>
                setForm({ ...form, nomeFantasia: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razão Social
            </label>
            <input
              type="text"
              value={form.razaoSocial}
              onChange={(e) =>
                setForm({ ...form, razaoSocial: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => {
                const masked = formatCNPJ(e.target.value);
                setForm({ ...form, cnpj: masked });
                if (fieldErrors.cnpj) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.cnpj;
                    return next;
                  });
                }
              }}
              onBlur={() => {
                const digits = form.cnpj.replace(/\D/g, "");
                if (digits.length > 0 && !validarCNPJ(form.cnpj)) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    cnpj: "CNPJ inválido",
                  }));
                }
              }}
              placeholder="00.000.000/0000-00"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${fieldErrors.cnpj ? "border-red-500" : ""}`}
            />
            {fieldErrors.cnpj && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.cnpj}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <input
              type="text"
              maxLength={2}
              value={form.estado}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsável
            </label>
            <input
              type="text"
              value={form.responsavelNome}
              onChange={(e) =>
                setForm({ ...form, responsavelNome: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF Responsável
            </label>
            <input
              type="text"
              value={form.responsavelCpf}
              onChange={(e) =>
                setForm({ ...form, responsavelCpf: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          {/* Seção de Dados Bancários */}
          <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Dados Bancários (Opcional)
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de PIX
            </label>
            <select
              value={form.pixTipo}
              onChange={(e) => {
                setForm({ ...form, pixTipo: e.target.value });
                if (fieldErrors.pixChave) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.pixChave;
                    return next;
                  });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Selecione...</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">Email</option>
              <option value="TELEFONE">Telefone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave PIX
            </label>
            <input
              type="text"
              value={form.pixChave}
              onChange={(e) => {
                setForm({ ...form, pixChave: e.target.value });
                if (fieldErrors.pixChave) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.pixChave;
                    return next;
                  });
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${fieldErrors.pixChave ? "border-red-500" : ""}`}
            />
            {fieldErrors.pixChave && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.pixChave}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <input
              type="text"
              value={form.bancoNome}
              onChange={(e) => setForm({ ...form, bancoNome: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agência
            </label>
            <input
              type="text"
              value={form.agencia}
              onChange={(e) => setForm({ ...form, agencia: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conta
            </label>
            <input
              type="text"
              value={form.conta}
              onChange={(e) => setForm({ ...form, conta: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {estabs.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {e.nomeFantasia}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {e.cnpj} &middot; {e.cidade}/{e.estado}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === "ATIVO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {e.status}
                    </span>
                    {e.cupomConfig && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Cupom: {e.cupomConfig.codigoCupom}
                      </span>
                    )}
                    {e._count.usuarios > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Acesso ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Sem acesso
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {e._count.comissoes} comissões
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => gerarConvite(e.id, e.nomeFantasia)}
                    disabled={gerandoConvite === e.id}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${e._count.usuarios > 0 ? "bg-gray-50 text-gray-600 hover:bg-gray-100" : "bg-primary-50 text-primary-700 hover:bg-primary-100"} disabled:opacity-50`}
                    title={
                      e._count.usuarios > 0
                        ? "Gerar novo link de acesso"
                        : "Enviar link de primeiro acesso"
                    }
                  >
                    {gerandoConvite === e.id
                      ? "Gerando..."
                      : e._count.usuarios > 0
                        ? "🔗 Reenviar acesso"
                        : "🔗 Enviar acesso"}
                  </button>
                  {e.cupomConfig && (
                    <button
                      onClick={() => downloadQR(e.id)}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      QR Code
                    </button>
                  )}
                  <label className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                    {uploadingId === e.id ? "Enviando..." : "Upload Doc"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(ev) => {
                        const file = ev.target.files?.[0];
                        if (file) {
                          const tipo = confirm(
                            "Tipo CNPJ? (OK = CNPJ, Cancelar = CPF_RESPONSAVEL)",
                          )
                            ? "CNPJ"
                            : "CPF_RESPONSAVEL";
                          handleUpload(e.id, file, tipo);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              {!e.cupomConfig && (
                <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-amber-600">
                  Aguardando registro do código de cupom pelo gestor
                </p>
              )}
              {e.documentos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Documentos:</p>
                  <div className="flex gap-2 flex-wrap">
                    {e.documentos.map((d) => (
                      <span
                        key={d.id}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {d.tipo}: {d.nomeOriginal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(e.pixChave || e.bancoNome || e.agencia || e.conta) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-700 font-semibold mb-2">
                    Dados Bancários:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {e.pixTipo && e.pixChave && (
                      <>
                        <div>
                          <span className="text-gray-500">
                            PIX ({e.pixTipo}):
                          </span>
                          <p className="text-gray-900 font-medium">
                            {e.pixChave}
                          </p>
                        </div>
                      </>
                    )}
                    {e.bancoNome && (
                      <div>
                        <span className="text-gray-500">Banco:</span>
                        <p className="text-gray-900 font-medium">
                          {e.bancoNome}
                        </p>
                      </div>
                    )}
                    {e.agencia && (
                      <div>
                        <span className="text-gray-500">Agência:</span>
                        <p className="text-gray-900 font-medium">{e.agencia}</p>
                      </div>
                    )}
                    {e.conta && (
                      <div>
                        <span className="text-gray-500">Conta:</span>
                        <p className="text-gray-900 font-medium">{e.conta}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {estabs.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Nenhum estabelecimento cadastrado
            </div>
          )}
        </div>
      )}

      {/* Modal de convite */}
      {conviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Link de acesso
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {conviteModal.nomeFantasia}
                </p>
              </div>
              <button
                onClick={() => setConviteModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Envie o link abaixo para o estabelecimento via WhatsApp, e-mail ou
              qualquer outro canal. O link expira em <strong>7 dias</strong>.
            </p>

            <div className="flex gap-2">
              <input
                id="convite-link-input"
                type="text"
                readOnly
                value={conviteModal.link}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 bg-gray-50 focus:outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => copiarLink(conviteModal.link)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${copiadoConvite ? "bg-green-600 text-white" : "bg-primary-600 text-white hover:bg-primary-700"}`}
              >
                {copiadoConvite ? "✓ Copiado!" : "Copiar"}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              O estabelecimento precisará informar nome, e-mail e criar uma
              senha ao acessar o link.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
