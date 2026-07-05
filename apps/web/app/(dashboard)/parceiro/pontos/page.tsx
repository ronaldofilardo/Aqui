"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

type TabType = "carteira" | "extrato" | "premios" | "ranking" | "resgates";

interface PontosData {
  carteira?: any;
  extrato?: any;
  premios?: any;
  ranking?: any;
  resgates?: any;
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "carteira", label: "Carteira", icon: "💼" },
  { id: "extrato", label: "Extrato", icon: "📄" },
  { id: "premios", label: "Prêmios", icon: "🎁" },
  { id: "ranking", label: "Ranking", icon: "🏆" },
  { id: "resgates", label: "Resgates", icon: "🔄" },
];

export default function ParceiroPontosPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("carteira");
  const [data, setData] = useState<PontosData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.parceiroId) {
      fetchData();
    }
  }, [session?.user?.parceiroId, activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      // Load active tab data
      const endpoint = `/api/v1/parceiro/pontos/${activeTab}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const tabData = await res.json();
        setData((prev) => ({ ...prev, [activeTab]: tabData }));
      }
    } catch (e) {
      toast.error(`Erro ao carregar ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pontos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie seus pontos, carteira e resgates
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-wrap border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-gray-400">Carregando...</div>
            </div>
          ) : (
            <>
              {activeTab === "carteira" && (
                <CarteiraPontos data={data.carteira} />
              )}
              {activeTab === "extrato" && <ExtratoPontos data={data.extrato} />}
              {activeTab === "premios" && <PremiosPontos data={data.premios} />}
              {activeTab === "ranking" && <RankingPontos data={data.ranking} />}
              {activeTab === "resgates" && (
                <ResgatePontos data={data.resgates} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componentes de cada aba

function CarteiraPontos({ data }: { data?: any }) {
  const [periodicidade, setPeriodicidade] = useState<string | null>(
    data?.periodicidadeCicloEscolhida ?? null,
  );
  const [salvando, setSalvando] = useState(false);
  const [bloqueado, setBloqueado] = useState<boolean>(!!data?.temMovimentacoes);

  useEffect(() => {
    if (data) {
      setPeriodicidade(data.periodicidadeCicloEscolhida ?? null);
      setBloqueado(!!data.temMovimentacoes);
    }
  }, [data]);

  async function handleSalvarPeriodicidade() {
    if (!periodicidade) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/v1/parceiro/pontos/preferencia-ciclo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodicidade }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar preferência");
        return;
      }
      toast.success("Preferência de ciclo atualizada");
      setBloqueado(true);
    } catch {
      toast.error("Erro ao salvar preferência");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Carteira de Pontos
      </h2>
      {!data ? (
        <div className="text-center py-8 text-gray-500">
          Carregando dados da carteira...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Saldo Total de Pontos</p>
            <p className="text-4xl font-bold text-primary-600">
              {data?.saldo ?? data?.saldoAtual ?? 0}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="font-semibold text-gray-900 mb-2">
              🎯 Quero resgatar meus pontos:
            </p>
            <div className="space-y-2 mt-3">
              <label className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="periodicidade"
                  value="SEMESTRAL"
                  checked={periodicidade === "SEMESTRAL"}
                  disabled={bloqueado}
                  onChange={() => setPeriodicidade("SEMESTRAL")}
                />
                <span className="text-sm text-gray-700">
                  A cada semestre
                </span>
              </label>
              <label className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="periodicidade"
                  value="ANUAL"
                  checked={periodicidade === "ANUAL"}
                  disabled={bloqueado}
                  onChange={() => setPeriodicidade("ANUAL")}
                />
                <span className="text-sm text-gray-700">
                  Ao final do ano
                </span>
              </label>
            </div>
            {bloqueado ? (
              <p className="text-xs text-gray-500 mt-3">
                Sua preferência foi registrada e afeta apenas novos ciclos. A
                troca fica disponível após o encerramento do ciclo em andamento.
              </p>
            ) : (
              <button
                onClick={handleSalvarPeriodicidade}
                disabled={salvando || !periodicidade}
                className="mt-3 w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar preferência"}
              </button>
            )}
          </div>

          {data?.historico && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Últimas Transações
              </h3>
              {data.historico.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">
                    {item.descricao}
                  </span>
                  <span
                    className={`font-semibold ${item.tipo === "ganho" ? "text-green-600" : "text-red-600"}`}
                  >
                    {item.tipo === "ganho" ? "+" : "-"}
                    {item.pontos}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExtratoPontos({ data }: { data?: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Extrato de Pontos
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum movimento encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.descricao}</p>
                <p className="text-xs text-gray-500">{item.data}</p>
              </div>
              <p
                className={`text-lg font-bold ${item.tipo === "credito" ? "text-green-600" : "text-red-600"}`}
              >
                {item.tipo === "credito" ? "+" : "-"}
                {item.pontos}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PremiosPontos({ data }: { data?: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Prêmios Disponíveis
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum prêmio disponível
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((premio: any) => (
            <div
              key={premio.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">{premio.icone || "🎁"}</div>
              <h3 className="font-semibold text-gray-900">{premio.nome}</h3>
              <p className="text-sm text-gray-600 mt-1">{premio.descricao}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-bold text-primary-600">
                  {premio.pontos} pts
                </span>
                <button className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded hover:bg-primary-100">
                  Resgatar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RankingPontos({ data }: { data?: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Ranking de Pontos
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum dado de ranking disponível
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-lg ${idx < 3 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-600">
                  #{idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{item.nome}</p>
                  <p className="text-xs text-gray-500">
                    {item.parceiros} parceiros
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary-600">
                {item.pontos}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResgatePontos({ data }: { data?: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Histórico de Resgates
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum resgate realizado
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item: any) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.premio}</p>
                <p className="text-xs text-gray-500">{item.data}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">-{item.pontos} pts</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.status === "concluido"
                      ? "bg-green-100 text-green-700"
                      : item.status === "pendente"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status === "concluido"
                    ? "✓ Concluído"
                    : item.status === "pendente"
                      ? "Pendente"
                      : item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
