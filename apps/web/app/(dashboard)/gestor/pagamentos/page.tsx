"use client";

import { useEffect, useState } from "react";

interface Comissao {
  id: string;
  estabelecimento: string;
  dataAgendamento: string | null;
  dataRealizacao: string | null;
  statusConsulta: string;
  valorEstabelecimento?: number;
  valorConsultor?: number;
  statusPagamento: string;
  consultor?: string;
}

interface Recibo {
  tipo: string;
  data: string;
  referencia: string;
  beneficiario: string;
  valor: string;
  txId: string;
  status: string;
  comissoes?: Comissao[];
  pagamentoId?: string;
}

interface PagamentoConsultor {
  id: string;
  valorTotal: string;
  quantidadeConsultas: number;
  status: string;
  pixTxid: string | null;
  pagoEm: string | null;
  consultor: { usuario: { nome: string; email: string } };
}

interface PagamentoEstabelecimento {
  id: string;
  nomeFantasia: string;
  email: string | null;
  pixChave: string | null;
  pixTipo: string | null;
  valorTotal: number;
  quantidadeConsultas: number;
  status: string;
  dataPagamento: string | null;
  consultores: Array<{ id: string; nome: string }>;
}

interface PixModalData {
  isOpen: boolean;
  tipo: "consultor" | "estabelecimento";
  pagamentoId: string;
  nome: string;
  email: string;
  valor: number;
}

interface ReciboData {
  isOpen: boolean;
  recibo: Recibo | null;
  email: string;
  nome: string;
  comissoes: Comissao[];
  mesReferencia: number;
  anoReferencia: number;
}

function PixPaymentModal({
  data,
  onConfirm,
  onClose,
  loading,
}: {
  data: PixModalData;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  if (!data.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🏦 Pagar via PIX
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Tipo de Pagamento
            </label>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {data.tipo === "consultor" ? "Consultor" : "Estabelecimento"}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Nome do Recebedor
            </label>
            <p className="text-sm font-medium text-gray-900">{data.nome}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <p className="text-sm font-medium text-gray-900">{data.email}</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-2xl font-bold text-blue-900">
              R${" "}
              {data.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              ✓ Recibo será enviado por email após confirmação
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processando..." : "Confirmar Pagamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReciboModal({
  data,
  onClose,
}: {
  data: ReciboData;
  onClose: () => void;
}) {
  if (!data.isOpen || !data.recibo) return null;

  const recibo = data.recibo;
  const mesNome = new Date(
    data.anoReferencia,
    data.mesReferencia - 1,
  ).toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          ✅ Recibo de Pagamento
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 bg-gray-50">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Referência:</span>
              <span className="font-medium text-gray-900">
                {recibo.referencia}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data:</span>
              <span className="font-medium text-gray-900">{recibo.data}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-600">Beneficiário:</span>
              <span className="font-medium text-gray-900">
                {recibo.beneficiario}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valor:</span>
              <span className="font-bold text-green-600 text-lg">
                {recibo.valor}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-600">TxID PIX:</span>
              <span className="font-mono text-xs text-gray-700 break-all">
                {recibo.txId}
              </span>
            </div>
            <div className="border-t pt-3">
              <span className="text-gray-600">Status:</span>
              <p className="font-medium text-green-600">✓ {recibo.status}</p>
            </div>
          </div>
        </div>

        {/* Detalhes das Comissões */}
        {data.comissoes && data.comissoes.length > 0 && (
          <div className="mt-6 py-4 border-t">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">
              📋 Comissões Incluídas ({mesNome})
            </h3>
            <div className="space-y-3">
              {data.comissoes.map((com) => (
                <div
                  key={com.id}
                  className="bg-gray-50 p-3 rounded border border-gray-200 text-xs"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {com.estabelecimento}
                      {com.consultor && ` (${com.consultor})`}
                    </span>
                    <span className="text-green-600 font-medium">
                      R${" "}
                      {(
                        com.valorConsultor ||
                        com.valorEstabelecimento ||
                        0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    {com.dataRealizacao && (
                      <div>
                        Realizada em:{" "}
                        {new Date(com.dataRealizacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </div>
                    )}
                    {com.dataAgendamento && !com.dataRealizacao && (
                      <div>
                        Agendada para:{" "}
                        {new Date(com.dataAgendamento).toLocaleDateString(
                          "pt-BR",
                        )}
                      </div>
                    )}
                    <div>Status: {com.statusConsulta}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-900 font-medium">
                Total de {data.comissoes.length} consulta(s) no período
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg my-6 text-xs text-blue-700">
          📧 Um recibo foi enviado para <strong>{data.email}</strong>
        </div>

        <div className="flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Fechar
          </button>
          <button
            onClick={handleImprimir}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PagamentosPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [pagamentosConsultores, setPagamentosConsultores] = useState<
    PagamentoConsultor[]
  >([]);
  const [pagamentosEstabelecimentos, setPagamentosEstabelecimentos] = useState<
    PagamentoEstabelecimento[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [pixModal, setPixModal] = useState<PixModalData>({
    isOpen: false,
    tipo: "consultor",
    pagamentoId: "",
    nome: "",
    email: "",
    valor: 0,
  });
  const [reciboModal, setReciboModal] = useState<ReciboData>({
    isOpen: false,
    recibo: null,
    email: "",
    nome: "",
    comissoes: [],
    mesReferencia: 0,
    anoReferencia: 0,
  });
  const [loadingPix, setLoadingPix] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState({
    consultores: true,
    estabelecimentos: true,
  });
  const [filtroStatus, setFiltroStatus] = useState<string | "">("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/gestor/pagamentos?mes=${mes}&ano=${ano}`)
      .then((r) => r.json())
      .then((data) => {
        setPagamentosConsultores(data.pagamentosConsultores || []);
        setPagamentosEstabelecimentos(data.pagamentosEstabelecimentos || []);
      })
      .finally(() => setLoading(false));
  }, [mes, ano]);

  const abrirModalPix = (
    tipo: "consultor" | "estabelecimento",
    pagamento: PagamentoConsultor | PagamentoEstabelecimento,
  ) => {
    if (tipo === "consultor") {
      const p = pagamento as PagamentoConsultor;
      setPixModal({
        isOpen: true,
        tipo,
        pagamentoId: p.id,
        nome: p.consultor.usuario.nome,
        email: p.consultor.usuario.email,
        valor: Number(p.valorTotal),
      });
    } else {
      const p = pagamento as PagamentoEstabelecimento;
      setPixModal({
        isOpen: true,
        tipo,
        pagamentoId: p.id,
        nome: p.nomeFantasia,
        email: p.email ?? "",
        valor: p.valorTotal,
      });
    }
  };

  const confirmarPagamentoPix = async () => {
    setLoadingPix(true);
    try {
      const endpointPix =
        pixModal.tipo === "estabelecimento"
          ? `/api/v1/gestor/pagamentos/estabelecimento/${pixModal.pagamentoId}/pix-pagar`
          : `/api/v1/gestor/pagamentos/${pixModal.pagamentoId}/pix-pagar`;

      const bodyPix =
        pixModal.tipo === "estabelecimento"
          ? JSON.stringify({ mesReferencia: mes, anoReferencia: ano })
          : JSON.stringify({});

      const res = await fetch(endpointPix, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyPix,
      });

      const data = await res.json();

      if (res.ok) {
        setReciboModal({
          isOpen: true,
          recibo: data.recibo,
          email: pixModal.email,
          nome: pixModal.nome,
          comissoes: data.comissoes || [],
          mesReferencia: mes,
          anoReferencia: ano,
        });

        setMsg(data.mensagem);
        setPixModal({ ...pixModal, isOpen: false });

        // Recarregar pagamentos
        const refreshRes = await fetch(
          `/api/v1/gestor/pagamentos?mes=${mes}&ano=${ano}`,
        );
        const refreshData = await refreshRes.json();
        setPagamentosConsultores(refreshData.pagamentosConsultores || []);
        setPagamentosEstabelecimentos(
          refreshData.pagamentosEstabelecimentos || [],
        );
      } else {
        setMsg(data.error || "Erro ao processar pagamento");
      }
    } catch (err) {
      setMsg("Erro ao processar pagamento");
      console.error(err);
    } finally {
      setLoadingPix(false);
    }
  };

  const abrirModalRecibo = async (
    tipo: "consultor" | "estabelecimento",
    pagamento: PagamentoConsultor | PagamentoEstabelecimento,
  ) => {
    try {
      const endpointRecibo =
        tipo === "estabelecimento"
          ? `/api/v1/gestor/pagamentos/estabelecimento/${pagamento.id}/recibo`
          : `/api/v1/gestor/pagamentos/${pagamento.id}/recibo`;

      const queryParams = new URLSearchParams();
      queryParams.append("mes", mes.toString());
      queryParams.append("ano", ano.toString());

      const res = await fetch(`${endpointRecibo}?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok) {
        const nome =
          tipo === "consultor"
            ? (pagamento as PagamentoConsultor).consultor.usuario.nome
            : (pagamento as PagamentoEstabelecimento).nomeFantasia;

        const email =
          tipo === "consultor"
            ? (pagamento as PagamentoConsultor).consultor.usuario.email
            : ((pagamento as PagamentoEstabelecimento).email ?? "");

        setReciboModal({
          isOpen: true,
          recibo: data.recibo,
          email,
          nome,
          comissoes: data.comissoes || [],
          mesReferencia: mes,
          anoReferencia: ano,
        });
      } else {
        setMsg(data.error || "Erro ao carregar recibo");
      }
    } catch (err) {
      setMsg("Erro ao carregar recibo");
      console.error(err);
    }
  };

  async function handleProcessar() {
    setProcessing(true);
    setMsg("");
    const res = await fetch("/api/v1/gestor/pagamentos/processar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesReferencia: mes, anoReferencia: ano }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`Processados ${data.pagamentos?.length || 0} pagamento(s)`);
      // Refresh list
      const refreshRes = await fetch(
        `/api/v1/gestor/pagamentos?mes=${mes}&ano=${ano}`,
      );
      const refreshData = await refreshRes.json();
      setPagamentosConsultores(refreshData.pagamentosConsultores || []);
      setPagamentosEstabelecimentos(
        refreshData.pagamentosEstabelecimentos || [],
      );
    } else {
      setMsg(data.error || "Erro ao processar");
    }
    setProcessing(false);
  }

  const statusColor: Record<string, string> = {
    PENDENTE: "bg-yellow-100 text-yellow-700",
    PROCESSANDO: "bg-blue-100 text-blue-700",
    PAGO: "bg-green-100 text-green-700",
    FALHOU: "bg-red-100 text-red-700",
  };

  // Filtrar pagamentos combinados
  const pagamentosCombinados = [
    ...(filtroTipo.consultores
      ? pagamentosConsultores.map((p) => ({ ...p, tipo: "consultor" as const }))
      : []),
    ...(filtroTipo.estabelecimentos
      ? pagamentosEstabelecimentos.map((p) => ({
          ...p,
          tipo: "estabelecimento" as const,
        }))
      : []),
  ].filter((p) => !filtroStatus || p.status === filtroStatus);

  const statusesUnicos = Array.from(
    new Set([
      ...pagamentosConsultores.map((p) => p.status),
      ...pagamentosEstabelecimentos.map((p) => p.status),
    ]),
  ).sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <button
          onClick={handleProcessar}
          disabled={processing}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
        >
          {processing ? "Processando..." : "Processar Pagamentos do Mês"}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes("Erro") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
        >
          {msg}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {String(i + 1).padStart(2, "0")}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm w-24"
        />
      </div>

      {/* Filtros de Tipo */}
      <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filtroTipo.consultores}
            onChange={(e) =>
              setFiltroTipo({ ...filtroTipo, consultores: e.target.checked })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            👤 Consultores
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filtroTipo.estabelecimentos}
            onChange={(e) =>
              setFiltroTipo({
                ...filtroTipo,
                estabelecimentos: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            🏢 Estabelecimentos
          </span>
        </label>

        {/* Filtro de Status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-1 border rounded-lg text-sm ml-auto"
        >
          <option value="">📊 Todos os Status</option>
          {statusesUnicos.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : pagamentosCombinados.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {filtroTipo.consultores && filtroTipo.estabelecimentos
            ? "Nenhum pagamento no período"
            : "Nenhum pagamento encontrado com os filtros selecionados"}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500">Tipo</th>
                <th className="text-left px-6 py-3 text-gray-500">
                  Beneficiário
                </th>
                <th className="text-left px-6 py-3 text-gray-500">Consultor</th>
                <th className="text-left px-6 py-3 text-gray-500">Consultas</th>
                <th className="text-left px-6 py-3 text-gray-500">
                  Valor Total
                </th>
                <th className="text-left px-6 py-3 text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-gray-500">
                  Data Pagamento
                </th>
                <th className="text-left px-6 py-3 text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagamentosCombinados.map((p) => {
                if (p.tipo === "consultor") {
                  const pc = p as PagamentoConsultor & { tipo: "consultor" };
                  return (
                    <tr key={`consultor-${pc.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          👤 Consultor
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium">
                        {pc.consultor.usuario.nome}
                      </td>
                      <td className="px-6 py-3 text-gray-500">-</td>
                      <td className="px-6 py-3">{pc.quantidadeConsultas}</td>
                      <td className="px-6 py-3 font-medium">
                        R$ {Number(pc.valorTotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[pc.status] || ""}`}
                        >
                          {pc.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {pc.pagoEm
                          ? new Date(pc.pagoEm).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 items-center">
                          {pc.status !== "PAGO" ? (
                            <button
                              onClick={() => abrirModalPix("consultor", pc)}
                              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition font-medium"
                            >
                              💳 PIX
                            </button>
                          ) : (
                            <>
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Pago
                              </span>
                              <button
                                onClick={() =>
                                  abrirModalRecibo("consultor", pc)
                                }
                                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition font-medium"
                              >
                                🧾 Recibo
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  const pe = p as PagamentoEstabelecimento & {
                    tipo: "estabelecimento";
                  };
                  return (
                    <tr key={`estab-${pe.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                          🏢 Estabelecimento
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium">
                        {pe.nomeFantasia}
                      </td>
                      <td className="px-6 py-3 text-gray-700 text-xs">
                        {pe.consultores.length > 0 ? (
                          <div className="space-y-1">
                            {pe.consultores.map((c) => (
                              <div
                                key={c.id}
                                className="bg-blue-50 px-2 py-1 rounded"
                              >
                                {c.nome}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3">{pe.quantidadeConsultas}</td>
                      <td className="px-6 py-3 font-medium">
                        R$ {pe.valorTotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[pe.status] || ""}`}
                        >
                          {pe.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {pe.dataPagamento
                          ? new Date(pe.dataPagamento).toLocaleDateString(
                              "pt-BR",
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 items-center">
                          {pe.status !== "PAGO" && pe.pixChave ? (
                            <button
                              onClick={() =>
                                abrirModalPix("estabelecimento", pe)
                              }
                              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition font-medium"
                            >
                              💳 PIX
                            </button>
                          ) : pe.status === "PAGO" ? (
                            <>
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Pago
                              </span>
                              <button
                                onClick={() =>
                                  abrirModalRecibo("estabelecimento", pe)
                                }
                                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition font-medium"
                              >
                                🧾 Recibo
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Sem chave PIX
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      )}

      <PixPaymentModal
        data={pixModal}
        onConfirm={confirmarPagamentoPix}
        onClose={() => setPixModal({ ...pixModal, isOpen: false })}
        loading={loadingPix}
      />

      <ReciboModal
        data={reciboModal}
        onClose={() => setReciboModal({ ...reciboModal, isOpen: false })}
      />
    </div>
  );
}
