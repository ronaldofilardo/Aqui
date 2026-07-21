"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { useComerciais } from "../../usuarios/comerciais/hooks/use-comerciais";
import type { Comercial, Meta } from "../../usuarios/comerciais/types";
import { formatCpf } from "../../usuarios/comerciais/utils";
import { NovoComercialForm } from "../../usuarios/comerciais/components/novo-comercial-form";
import { ComercialModal } from "../../usuarios/comerciais/components/comercial-modal";

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

function formatarMoeda(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  const numero = Number(numeros) / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoeda(valor: string): string {
  const numeros = valor.replace(/\./g, "").replace(",", ".");
  return numeros;
}

export function TabComerciais() {
  const { comerciais, loading, refetch: refetchComerciais, setComerciais } = useComerciais();
  const [metasGerais, setMetasGerais] = useState<Record<string, Meta[]>>({});
  const [loadingMetasGerais, setLoadingMetasGerais] = useState(false);
  const [metaVersion, setMetaVersion] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);
  const [anoReferencia] = useState(new Date().getFullYear());
  const [metasInputs, setMetasInputs] = useState<Record<string, Record<string, string>>>({});
  const [metasAlteradas, setMetasAlteradas] = useState<Set<string>>(new Set());
  const [producaoInputs, setProducaoInputs] = useState<Record<string, Record<string, string>>>({});
  const [producaoAlteradas, setProducaoAlteradas] = useState<Set<string>>(new Set());

  async function fetchMetasGerais() {
    setLoadingMetasGerais(true);
    try {
      const promises = comerciais.map(async (c) => {
        const res = await fetch(`/api/v1/backoffice/comerciais/${c.id}/metas`);
        const metas = res.ok ? await res.json() : [];
        return { comercialId: c.id, metas };
      });
      const results = await Promise.all(promises);
      const map: Record<string, Meta[]> = {};
      const inputsMap: Record<string, Record<string, string>> = {};
      const producaoMap: Record<string, Record<string, string>> = {};
      results.forEach((r) => {
        map[r.comercialId] = r.metas;
        inputsMap[r.comercialId] = {};
        producaoMap[r.comercialId] = {};
        r.metas.forEach((m: Meta) => {
          const metaFormatada = Number(m.valorMeta).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          inputsMap[r.comercialId][m.mesReferencia] = metaFormatada;
          const atingido = Number(m.valorAtingido ?? 0);
          const producaoFormatada = atingido > 0 ? atingido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
          producaoMap[r.comercialId][m.mesReferencia] = producaoFormatada;
        });
      });
      setMetasGerais(map);
      setMetasInputs(inputsMap);
      setProducaoInputs(producaoMap);
      setMetasAlteradas(new Set());
      setProducaoAlteradas(new Set());
      setMetaVersion((v) => v + 1);
    } catch {
      toast.error("Erro ao carregar metas gerais");
    } finally {
      setLoadingMetasGerais(false);
    }
  }

  async function handleSalvarTodasMetas() {
    const metasParaSalvar: Array<{ comercialId: string; mes: string; valor: string }> = [];
    metasAlteradas.forEach((key) => {
      const [comercialId, mes] = key.split('|');
      const valor = metasInputs[comercialId]?.[mes];
      if (valor) {
        metasParaSalvar.push({ comercialId, mes, valor });
      }
    });

    const producoesParaSalvar: Array<{ comercialId: string; mes: string; valor: string }> = [];
    producaoAlteradas.forEach((key) => {
      const [comercialId, mes] = key.split('|');
      const valor = producaoInputs[comercialId]?.[mes];
      if (valor) {
        producoesParaSalvar.push({ comercialId, mes, valor });
      }
    });

    type Registro = { comercialId: string; mes: string; valorMeta?: string; valorAtingido?: string };
    const registros = new Map<string, Registro>();
    metasParaSalvar.forEach(({ comercialId, mes, valor }) => {
      const key = `${comercialId}|${mes}`;
      registros.set(key, { ...(registros.get(key) || { comercialId, mes }), valorMeta: valor });
    });
    producoesParaSalvar.forEach(({ comercialId, mes, valor }) => {
      const key = `${comercialId}|${mes}`;
      registros.set(key, { ...(registros.get(key) || { comercialId, mes }), valorAtingido: valor });
    });

    if (registros.size === 0) {
      toast.info("Nenhuma meta ou produção para salvar");
      return;
    }

    try {
      let salvos = 0;
      let erros = 0;

      await Promise.all(
        Array.from(registros.values()).map(async ({ comercialId, mes, valorMeta, valorAtingido }) => {
          if (valorMeta !== undefined) {
            const valorNumerico = parseMoeda(valorMeta);
            const num = parseFloat(valorNumerico);
            if (isNaN(num) || num < 0) {
              erros++;
              return;
            }
          }
          if (valorAtingido !== undefined) {
            const valorNumerico = parseMoeda(valorAtingido);
            const num = parseFloat(valorNumerico);
            if (isNaN(num) || num < 0) {
              erros++;
              return;
            }
          }

          try {
            const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mesReferencia: mes,
                ...(valorMeta !== undefined ? { valorMeta: parseFloat(parseMoeda(valorMeta)) } : {}),
                ...(valorAtingido !== undefined ? { valorAtingido: parseFloat(parseMoeda(valorAtingido)) } : {}),
              }),
            });

            if (res.ok) {
              salvos++;
            } else {
              erros++;
            }
          } catch {
            erros++;
          }
        })
      );

      if (erros === 0) {
        toast.success(`${salvos} registro(s) salvo(s) com sucesso!`);
      } else {
        toast.warning(`${salvos} salvos, ${erros} com erro`);
      }

      setMetasAlteradas(new Set());
      setProducaoAlteradas(new Set());
      await fetchMetasGerais();
    } catch {
      toast.error("Erro ao salvar metas");
    }
  }

  function handleChangeMeta(comercialId: string, mes: string, valor: string) {
    const valorFormatado = formatarMoeda(valor);
    setMetasInputs((prev) => {
      const comercialInputs = prev[comercialId] || {};
      return {
        ...prev,
        [comercialId]: {
          ...comercialInputs,
          [mes]: valorFormatado,
        },
      };
    });
    setMetasAlteradas((prev) => {
      const nova = new Set(prev);
      nova.add(`${comercialId}|${mes}`);
      return nova;
    });
  }

  function handleChangeProducao(comercialId: string, mes: string, valor: string) {
    const valorFormatado = formatarMoeda(valor);
    setProducaoInputs((prev) => {
      const comercialInputs = prev[comercialId] || {};
      return {
        ...prev,
        [comercialId]: {
          ...comercialInputs,
          [mes]: valorFormatado,
        },
      };
    });
    setProducaoAlteradas((prev) => {
      const nova = new Set(prev);
      nova.add(`${comercialId}|${mes}`);
      return nova;
    });
  }

  async function handleEditarComercial(comercialId: string) {
    const comercial = comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;
    setComercialEditando(comercial);
    setShowModal(true);
  }

  async function handleSalvarEdicao(formData: Comercial) {
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${formData.id}`, {
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
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/comissoes`);
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
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}`, { method: "DELETE" });
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
      setMetasInputs((prev) => {
        const novo = { ...prev };
        delete novo[comercialId];
        return novo;
      });
      setProducaoInputs((prev) => {
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
    const valorNumerico = parseMoeda(valor);
    const num = parseFloat(valorNumerico);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
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
      setMetasInputs((prev) => ({
        ...prev,
        [comercialId]: {
          ...prev[comercialId],
          [mes]: valor,
        },
      }));
      setMetasAlteradas((prev) => {
        const nova = new Set(prev);
        nova.delete(`${comercialId}|${mes}`);
        return nova;
      });
      fetchMetasGerais();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  async function handleSalvarProducaoGeral(comercialId: string, mes: string, valor: string) {
    const valorNumerico = parseMoeda(valor);
    const num = parseFloat(valorNumerico);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorAtingido: num }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar produção");
        return;
      }
      toast.success("Produção salva");
      setProducaoInputs((prev) => ({
        ...prev,
        [comercialId]: {
          ...prev[comercialId],
          [mes]: valor,
        },
      }));
      setProducaoAlteradas((prev) => {
        const nova = new Set(prev);
        nova.delete(`${comercialId}|${mes}`);
        return nova;
      });
      fetchMetasGerais();
    } catch {
      toast.error("Erro ao salvar produção");
    }
  }

  useEffect(() => {
    if (comerciais.length > 0) {
      fetchMetasGerais();
    }
  }, [comerciais]);

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        <NovoComercialForm onCreated={refetchComerciais} />
      </div>

      <div className="card mt-6 flex-grow overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Comerciais Cadastrados - Metas Anual ({anoReferencia})
          </h2>
          <button
            onClick={handleSalvarTodasMetas}
            disabled={metasAlteradas.size === 0 && producaoAlteradas.size === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              metasAlteradas.size > 0 || producaoAlteradas.size > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            💾 Salvar ({metasAlteradas.size + producaoAlteradas.size})
          </button>
        </div>
        {loadingMetasGerais ? (
          <p className="text-sm text-gray-500">Carregando metas...</p>
        ) : comerciais.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum comercial cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto flex-grow max-h-[600px]">
            <table className="w-full text-sm table-auto min-w-[1800px]">
              <thead>
                <tr className="border-b bg-gray-50 sticky top-0 z-10">
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[200px]">Comercial</th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">Função</th>
                  <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]">Ações</th>
                  <th className="text-left p-2 font-semibold text-gray-700 bg-gray-50 w-[80px]"></th>
                  {mesesAno.map((m) => (
                    <th key={m.value} className="text-center p-2 font-semibold text-gray-700 w-[120px]">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comerciais.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 align-top border-t" rowSpan={2}>
                        <button
                          onClick={() => handleEditarComercial(c.id)}
                          className="text-left hover:text-primary-600 hover:underline"
                        >
                          <p className="font-medium text-gray-900 truncate">{c.nome}</p>
                          <p className="text-xs text-gray-500">{formatCpf(c.cpf)}</p>
                        </button>
                      </td>
                      <td className="p-3 align-top border-t" rowSpan={2}>
                        <p className="text-xs text-gray-600">{c.funcao ? c.funcao.replace(/_/g, " ") : "-"}</p>
                        <p className="text-xs text-gray-500">{c.status}</p>
                      </td>
                      <td className="p-2 text-center align-top border-t" rowSpan={2}>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleEditarComercial(c.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-blue-50"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletarComercial(c.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-red-50"
                            title="Deletar"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                      <td className="p-2 border-t">
                        <span className="text-[11px] font-medium text-gray-500">Meta</span>
                      </td>
                      {mesesAno.map((m) => {
                        const mesRef = `${anoReferencia}-${m.value}`;
                        return (
                          <td key={`meta-${m.value}-${metaVersion}`} className="p-2 border-t">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={metasInputs[c.id]?.[mesRef] ?? ""}
                              placeholder="R$ 0,00"
                              className="w-full px-3 py-2 border rounded text-sm text-right font-mono focus-ring"
                              onChange={(e) => {
                                handleChangeMeta(c.id, mesRef, e.target.value);
                              }}
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
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <span className="text-[11px] font-medium text-gray-500">Produção</span>
                      </td>
                      {mesesAno.map((m) => {
                        const mesRef = `${anoReferencia}-${m.value}`;
                        return (
                          <td key={`producao-${m.value}-${metaVersion}`} className="p-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={producaoInputs[c.id]?.[mesRef] ?? ""}
                              placeholder="R$ 0,00"
                              className="w-full px-3 py-2 border rounded text-sm text-right font-mono focus-ring bg-blue-50/40"
                              onChange={(e) => {
                                handleChangeProducao(c.id, mesRef, e.target.value);
                              }}
                              onBlur={(e) => {
                                const valor = e.target.value;
                                if (valor) {
                                  handleSalvarProducaoGeral(c.id, mesRef, valor);
                                }
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
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
