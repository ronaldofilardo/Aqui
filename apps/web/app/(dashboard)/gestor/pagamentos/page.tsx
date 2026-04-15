"use client";

import { useEffect, useState } from "react";

interface Recibo {
  tipo: string;
  data: string;
  referencia: string;
  beneficiario: string;
  valor: string;
  txId: string;
  status: string;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
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

        <div className="bg-blue-50 p-3 rounded-lg mb-6 text-xs text-blue-700">
          📧 Um recibo foi enviado para <strong>{data.email}</strong>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Fechar
        </button>
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
  });
  const [loadingPix, setLoadingPix] = useState(false);

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

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Pagamentos de Consultores */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Pagamentos a Consultores
            </h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Consultor
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Consultas
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Valor Total
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      PIX TxID
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Pago em
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagamentosConsultores.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">
                        {p.consultor.usuario.nome}
                      </td>
                      <td className="px-6 py-3">{p.quantidadeConsultas}</td>
                      <td className="px-6 py-3">
                        R$ {Number(p.valorTotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status] || ""}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {p.pixTxid || "-"}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {p.pagoEm
                          ? new Date(p.pagoEm).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-6 py-3">
                        {p.status !== "PAGO" ? (
                          <button
                            onClick={() => abrirModalPix("consultor", p)}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition font-medium"
                          >
                            💳 PIX
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Pago
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pagamentosConsultores.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Nenhum pagamento no período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagamentos de Estabelecimentos */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Pagamentos a Estabelecimentos
            </h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Estabelecimento
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Consultas
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Valor Total
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">
                      Pago em
                    </th>
                    <th className="text-left px-6 py-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagamentosEstabelecimentos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">
                        {p.nomeFantasia}
                      </td>
                      <td className="px-6 py-3">{p.quantidadeConsultas}</td>
                      <td className="px-6 py-3">
                        R$ {p.valorTotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status] || ""}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {p.dataPagamento
                          ? new Date(p.dataPagamento).toLocaleDateString(
                              "pt-BR",
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-3">
                        {p.status !== "PAGO" && p.pixChave ? (
                          <button
                            onClick={() => abrirModalPix("estabelecimento", p)}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition font-medium"
                          >
                            💳 PIX
                          </button>
                        ) : p.status === "PAGO" ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Pago
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sem chave PIX
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pagamentosEstabelecimentos.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Nenhum pagamento no período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
