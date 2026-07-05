"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Meta {
  id?: string;
  comercialId: string;
  mesReferencia: string;
  valorMeta: string | number;
  valorAtingido: string | number;
}

interface Payload {
  mesReferencia: string;
  metaAtual: Meta | null;
  historico: Meta[];
}

function formatBRL(v: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(typeof v === "string" ? parseFloat(v) : v);
}

export default function ComercialMinhasMetas() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/comercial/minhas-metas");
        if (res.ok) {
          setData(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          toast.error("Acesso restrito a usuários Comerciais");
        } else {
          toast.error("Erro ao carregar metas");
        }
      } catch {
        toast.error("Erro ao carregar metas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data) return null;

  const meta = data.metaAtual;
  const valorMeta = meta ? Number(meta.valorMeta) : 0;
  const valorAtingido = meta ? Number(meta.valorAtingido) : 0;
  const pct = valorMeta > 0 ? (valorAtingido / valorMeta) * 100 : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Metas</h1>
        <p className="text-gray-500 text-sm">
          Acompanhe suas metas mensais de vendas e seu progresso.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Meta do Mês ({data.mesReferencia})
        </h2>
        {!meta ? (
          <p className="text-sm text-gray-500">
            Nenhuma meta cadastrada para este mês. Solicite ao seu Gestor PF a
            definição da sua meta em R$.
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Progresso</span>
              <span className="text-sm font-semibold text-gray-700">
                {pct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-3 transition-all ${
                  pct >= 100
                    ? "bg-green-500"
                    : pct >= 70
                      ? "bg-primary-600"
                      : pct >= 30
                        ? "bg-yellow-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-gray-500">
                Atingido:{" "}
                <span className="font-semibold text-gray-900">
                  {formatBRL(valorAtingido)}
                </span>
              </span>
              <span className="text-gray-500">
                Meta:{" "}
                <span className="font-semibold text-gray-900">
                  {formatBRL(valorMeta)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Histórico de Metas
        </h2>
        {data.historico.length === 0 ? (
          <p className="text-sm text-gray-500">
            Sem metas ainda configuradas.
          </p>
        ) : (
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
              {data.historico.map((m) => {
                const vMeta = Number(m.valorMeta);
                const vAting = Number(m.valorAtingido);
                const p = vMeta > 0 ? (vAting / vMeta) * 100 : 0;
                return (
                  <tr key={`${m.comercialId}-${m.mesReferencia}`} className="border-b">
                    <td className="p-2">{m.mesReferencia}</td>
                    <td className="p-2 text-right">{formatBRL(vMeta)}</td>
                    <td className="p-2 text-right">{formatBRL(vAting)}</td>
                    <td
                      className={`p-2 text-right font-semibold ${
                        p >= 100
                          ? "text-green-600"
                          : p >= 70
                            ? "text-primary-600"
                            : p >= 30
                              ? "text-yellow-600"
                              : "text-red-600"
                      }`}
                    >
                      {p.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
