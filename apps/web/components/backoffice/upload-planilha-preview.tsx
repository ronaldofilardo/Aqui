"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface PreviewRow {
  rowNumber: number;
  dataReferencia: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  totalPago: number;
  unidade: string;
  usuarioDaConta: string;
  status: "VALIDO" | "ORFÃO" | "REJEITADO";
  motivo?: string;
  parceiroNome?: string;
  comercialNome?: string;
  gestorNome?: string;
}

interface PreviewData {
  fileName: string;
  previewRows: PreviewRow[];
  hasMore: boolean;
  totalRows: number;
  summary: {
    total: number;
    validos: number;
    orfaos: number;
    rejeitados: number;
    totalComissao: number;
    colunasEncontradas: string[];
    colunasObrigatorias: string[];
    colunasOpcionais: string[];
  };
}

export function UploadPlanilhaPreview() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Apenas arquivos Excel (.xlsx, .xls) são permitidos");
      return;
    }

    setFile(selectedFile);
    setPreviewData(null);
    setShowAllRows(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/v1/backoffice/uploads/preview", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao processar arquivo");
      }

      const data = await res.json();
      setPreviewData(data);
      toast.success(`Planilha processada: ${data.summary.total} linhas encontradas`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar arquivo");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = async () => {
    if (!file || !previewData) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/backoffice/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao fazer upload");
      }

      const data = await res.json();
      toast.success(`Upload concluído! ${data.summary.processedRows} linhas processadas`);
      
      // Reset
      setFile(null);
      setPreviewData(null);
      setShowAllRows(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALIDO":
        return "bg-green-100 text-green-800";
      case "ORFÃO":
        return "bg-yellow-100 text-yellow-800";
      case "REJEITADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayedRows = showAllRows 
    ? previewData?.previewRows 
    : previewData?.previewRows.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">📥 Upload de Planilha de Produção</h2>
        <p className="text-sm text-gray-500 mt-1">
          Envie a planilha de procedimentos para processamento automático
        </p>
      </div>

      {/* File Input */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading || uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700
              hover:file:bg-primary-100
              disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Apenas arquivos Excel (.xlsx ou .xls). A planilha deve conter as colunas:{" "}
          <span className="font-medium">Data de Referência, Paciente, CPF, Procedimento, Total Pago, Usuário da conta</span>
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-gray-600">Processando planilha...</span>
        </div>
      )}

      {/* Preview */}
      {previewData && !loading && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Resumo do Preview</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">{previewData.summary.total}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Válidos</p>
                <p className="text-lg font-bold text-green-700">{previewData.summary.validos}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-600">Órfãos</p>
                <p className="text-lg font-bold text-yellow-700">{previewData.summary.orfaos}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600">Rejeitados</p>
                <p className="text-lg font-bold text-red-700">{previewData.summary.rejeitados}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Total Comissão</p>
                <p className="text-lg font-bold text-blue-700">
                  R$ {previewData.summary.totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Colunas */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-gray-700 mb-2">Colunas Encontradas:</p>
              <div className="flex flex-wrap gap-1">
                {previewData.summary.colunasEncontradas.map((col) => (
                  <span key={col} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {col}
                  </span>
                ))}
              </div>
              {previewData.summary.colunasOpcionais.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Colunas opcionais: {previewData.summary.colunasOpcionais.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                Preview ({previewData.totalRows} linhas)
              </h3>
              {previewData.hasMore && (
                <button
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showAllRows ? "Mostrar menos" : "Ver todas as linhas"}
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium text-gray-600">#</th>
                    <th className="text-left p-2 font-medium text-gray-600">Data Ref.</th>
                    <th className="text-left p-2 font-medium text-gray-600">Paciente</th>
                    <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                    <th className="text-left p-2 font-medium text-gray-600">Procedimento</th>
                    <th className="text-left p-2 font-medium text-gray-600">Tipo</th>
                    <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
                    <th className="text-left p-2 font-medium text-gray-600">Usuário Conta</th>
                    <th className="text-right p-2 font-medium text-gray-600">Total Pago</th>
                    <th className="text-center p-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows?.map((row) => (
                    <tr key={row.rowNumber} className="border-t hover:bg-gray-50">
                      <td className="p-2 text-gray-500">{row.rowNumber}</td>
                      <td className="p-2 text-gray-900">{row.dataReferencia}</td>
                      <td className="p-2 text-gray-900 font-medium">{row.paciente}</td>
                      <td className="p-2 text-gray-600">
                        {row.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                      </td>
                      <td className="p-2 text-gray-600">{row.procedimento}</td>
                      <td className="p-2 text-gray-600">{row.tipoProcedimento}</td>
                      <td className="p-2 text-gray-600">{row.unidade}</td>
                      <td className="p-2 text-gray-600">{row.usuarioDaConta || "-"}</td>
                      <td className="p-2 text-right text-gray-900">
                        R$ {Number(row.totalPago).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                        {row.motivo && row.status === "REJEITADO" && (
                          <div className="text-xs text-red-600 mt-1" title={row.motivo}>
                            {row.motivo.length > 20 ? `${row.motivo.slice(0, 20)}...` : row.motivo}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || previewData.summary.rejeitados > 0}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Processando..." : `Confirmar Upload (${previewData.summary.validos} válidos)`}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setShowAllRows(false);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Novo Upload
            </button>
          </div>

          {previewData.summary.rejeitados > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> {previewData.summary.rejeitados} linhas foram rejeitadas. 
                Corrija os erros na planilha antes de confirmar o upload.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}