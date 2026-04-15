"use client";

import { useEffect, useState } from "react";

interface AuditItem {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  detalhes: Record<string, unknown> | null;
  criadoEm: string;
  usuario: { nome: string; email: string } | null;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtroAcao, setFiltroAcao] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (filtroAcao) params.set("acao", filtroAcao);

    fetch(`/api/v1/gestor/auditoria?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, filtroAcao]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Auditoria</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filtrar por ação..."
          value={filtroAcao}
          onChange={(e) => {
            setFiltroAcao(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg text-sm w-64"
        />
        <span className="text-sm text-gray-500 flex items-center">
          {total} registro(s)
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Data</th>
                <th className="text-left px-4 py-3 text-gray-500">Usuário</th>
                <th className="text-left px-4 py-3 text-gray-500">Ação</th>
                <th className="text-left px-4 py-3 text-gray-500">Entidade</th>
                <th className="text-left px-4 py-3 text-gray-500">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(l.criadoEm).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{l.usuario?.nome || "Sistema"}</td>
                  <td className="px-4 py-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                      {l.acao}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">{l.entidade}</td>
                  <td className="px-4 py-2 text-xs text-gray-400 max-w-xs truncate">
                    {l.detalhes ? JSON.stringify(l.detalhes) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-sm text-primary-600 disabled:text-gray-300"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < 50}
              className="text-sm text-primary-600 disabled:text-gray-300"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
