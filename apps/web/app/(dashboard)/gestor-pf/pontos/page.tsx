"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { usePontosData } from "./hooks/use-pontos-data";
import { DistribuirPontos } from "./components/distribuir-pontos";
import { CiclosPontos } from "./components/ciclos-pontos";
import { ConfiguracaoPontos } from "./components/configuracao-pontos";
import { PremiosPontos } from "./components/premios-pontos";
import { RankingPontos } from "./components/ranking-pontos";
import { ResgatePontos } from "./components/resgate-pontos";

type TabType = "ciclos" | "configuracao" | "premios" | "ranking" | "resgates" | "distribuir";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "ciclos", label: "Ciclos", icon: "📅" },
  { id: "configuracao", label: "Configuração", icon: "⚙️" },
  { id: "distribuir", label: "Distribuir Pontos", icon: "💰" },
  { id: "premios", label: "Prêmios", icon: "🎁" },
  { id: "ranking", label: "Ranking", icon: "🏆" },
  { id: "resgates", label: "Resgates", icon: "🔄" },
];

export default function GestorPFPontosPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("ciclos");
  const { data, loading } = usePontosData(activeTab, session?.user?.gestorPfId ?? undefined);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Pontos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie ciclos, prêmios e ranking de pontos da sua rede
          </p>
        </div>
      </div>

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

        <div className="p-6 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-gray-400">Carregando...</div>
            </div>
          ) : (
            <>
              {activeTab === "ciclos" && <CiclosPontos data={data.ciclos} />}
              {activeTab === "configuracao" && <ConfiguracaoPontos data={data.configuracao} />}
              {activeTab === "distribuir" && <DistribuirPontos data={data.distribuir} ciclo={data.ciclo} />}
              {activeTab === "premios" && <PremiosPontos data={data.premios} />}
              {activeTab === "ranking" && <RankingPontos data={data.ranking} />}
              {activeTab === "resgates" && <ResgatePontos data={data.resgates} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}