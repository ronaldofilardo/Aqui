"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function UploadPlanilhaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mesReferencia, setMesReferencia] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !mesReferencia) {
      toast.error("Selecione o arquivo e o mês de referência");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mesReferencia", mesReferencia);

      const res = await fetch("/api/v1/gestor-pf/producao", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao fazer upload");
        return;
      }

      toast.success("Planilha enviada com sucesso!");
      setFile(null);
      setMesReferencia("");
    } catch {
      toast.error("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📥 Upload de Planilha</h1>
        <p className="text-gray-500 text-sm mt-1">
          Envie a planilha de procedimentos para processamento
        </p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mês de Referência
            </label>
            <input
              type="month"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Apenas arquivos Excel (.xlsx ou .xls)
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading || !file || !mesReferencia}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "Enviar Planilha"}
          </button>
        </form>
      </div>
    </div>
  );
}