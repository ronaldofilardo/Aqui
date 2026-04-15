"use client";

import { useState } from "react";

interface ImportResult {
  sucesso: boolean;
  resumo: { total_linhas: number; importados: number; erros: number };
  erros: Array<{ linha: number; campo: string; mensagem: string }>;
  cupons_importados: Array<{ id: string; codigo: string; paciente: string }>;
}

export default function ImportarCuponsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target?.result as ArrayBuffer;
        let text = new TextDecoder("utf-8").decode(buffer);
        if (text.includes("\uFFFD")) {
          text = new TextDecoder("windows-1252").decode(buffer);
        }
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
        const lines = text.trim().split(/\r?\n/).slice(0, 20);
        const delimiter = lines[0]?.includes("\t")
          ? "\t"
          : lines[0]?.includes(";")
            ? ";"
            : ",";
        setPreview(lines.map((l) => l.split(delimiter).map((c) => c.trim())));
      };
      reader.readAsArrayBuffer(f);
    } else {
      setPreview([]);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mes_referencia", String(mes));
    formData.append("ano_referencia", String(ano));

    const res = await fetch("/api/v1/gestor/importar-cupons", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Importar Cupons</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo (.txt ou .csv)
            </label>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileChange}
              className="w-full text-sm border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mês Referência
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ano Referência
            </label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min={2024}
              max={2100}
            />
          </div>
        </div>

        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Preview ({preview.length} linhas):
            </h3>
            <div className="overflow-x-auto">
              <table className="text-xs border w-full">
                <tbody>
                  {preview.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i === 0 ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                      }
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="border px-2 py-1 whitespace-nowrap"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Importando..." : "Importar Cupons"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div
            className={`rounded-xl border p-6 ${result.sucesso ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <h3 className="font-semibold mb-2">
              {result.sucesso ? "Importação Concluída" : "Importação com Erros"}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total de linhas:</span>
                <span className="ml-2 font-medium">
                  {result.resumo.total_linhas}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Importados:</span>
                <span className="ml-2 font-medium text-green-700">
                  {result.resumo.importados}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Erros:</span>
                <span className="ml-2 font-medium text-red-700">
                  {result.resumo.erros}
                </span>
              </div>
            </div>
          </div>

          {result.erros.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-red-700 mb-2">
                Erros Encontrados
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-2">Linha</th>
                    <th className="text-left pb-2">Campo</th>
                    <th className="text-left pb-2">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {result.erros.map((e, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1">{e.linha}</td>
                      <td className="py-1">{e.campo}</td>
                      <td className="py-1 text-red-600">{e.mensagem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.cupons_importados.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-green-700 mb-2">
                Cupons Importados
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-2">Código</th>
                    <th className="text-left pb-2">Paciente</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cupons_importados.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50">
                      <td className="py-1 font-medium">{c.codigo}</td>
                      <td className="py-1">{c.paciente}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
