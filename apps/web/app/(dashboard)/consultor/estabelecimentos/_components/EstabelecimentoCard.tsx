"use client";

import { Estabelecimento } from "../lib/utils";

interface Props {
  e: Estabelecimento;
  uploadingId: string | null;
  gerandoConvite: string | null;
  onGerarConvite: (id: string, nome: string) => void;
  onDownloadQR: (id: string) => void;
  onUpload: (estabId: string, file: File, tipo: string) => void;
  setMsg: (msg: string) => void;
}

function resolveDocType(): string {
  return confirm("Tipo CNPJ? (OK = CNPJ, Cancelar = CPF_RESPONSAVEL)")
    ? "CNPJ"
    : "CPF_RESPONSAVEL";
}

export default function EstabelecimentoCard({
  e,
  uploadingId,
  gerandoConvite,
  onGerarConvite,
  onDownloadQR,
  onUpload,
  setMsg,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{e.nomeFantasia}</h3>
          <p className="text-sm text-gray-500">
            {e.cnpj} &middot; {e.cidade}/{e.estado}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <StatusBadge status={e.status} />
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
            <span className="text-xs text-gray-400">{e._count.comissoes} comissões</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onGerarConvite(e.id, e.nomeFantasia)}
            disabled={gerandoConvite === e.id}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${
              e._count.usuarios > 0
                ? "bg-gray-50 text-gray-600 hover:bg-gray-100"
                : "bg-primary-50 text-primary-700 hover:bg-primary-100"
            } disabled:opacity-50`}
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
              onClick={() => onDownloadQR(e.id)}
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
                  try {
                    const tipo = resolveDocType();
                    onUpload(e.id, file, tipo);
                  } catch {
                    setMsg("Erro ao definir tipo do documento");
                  }
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
              <span key={d.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {d.tipo}: {d.nomeOriginal}
              </span>
            ))}
          </div>
        </div>
      )}

      {(e.pixChave || e.bancoNome || e.agencia || e.conta) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-700 font-semibold mb-2">Dados Bancários:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {e.pixTipo && e.pixChave && (
              <div>
                <span className="text-gray-500">PIX ({e.pixTipo}):</span>
                <p className="text-gray-900 font-medium">{e.pixChave}</p>
              </div>
            )}
            {e.bancoNome && (
              <div>
                <span className="text-gray-500">Banco:</span>
                <p className="text-gray-900 font-medium">{e.bancoNome}</p>
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
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ATIVO";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}
