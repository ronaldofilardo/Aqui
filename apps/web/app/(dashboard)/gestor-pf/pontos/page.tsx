"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type TabType = "ciclos" | "configuracao" | "premios" | "ranking" | "resgates" | "distribuir";

interface PontosData {
  ciclos?: any;
  configuracao?: any;
  premios?: any;
  ranking?: any;
  resgates?: any;
  distribuicao?: any;
}

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
  const [data, setData] = useState<PontosData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.gestorPfId) {
      fetchData();
    }
  }, [session?.user?.gestorPfId, activeTab]);

async function fetchData() {
    setLoading(true);
    try {
      const endpoint = `/api/v1/gestor-pf/pontos/${activeTab}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const tabData = await res.json();
        let value: any = tabData;
        if (activeTab === "ciclos") value = tabData.ciclos;
        else if (activeTab === "configuracao") value = tabData.configuracoes;
        else if (activeTab === "distribuir") {
          value = tabData.producoes;
          if (tabData.ciclo) {
            setData((prev) => ({ ...prev, ciclo: tabData.ciclo }));
          }
        }
        else if (activeTab === "premios") value = tabData.premios;
        else if (activeTab === "ranking") value = tabData.ranking?.posicoes;
        else if (activeTab === "resgates") value = tabData.resgates;
        setData((prev) => ({ ...prev, [activeTab]: value }));
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
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Pontos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie ciclos, prêmios e ranking de pontos da sua rede
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
              {activeTab === "ciclos" && <CiclosPontos data={data.ciclos} />}
              {activeTab === "configuracao" && (
                <ConfiguracaoPontos data={data.configuracao} />
              )}
              {activeTab === "distribuir" && (
                <DistribuirPontos data={data.distribuir} ciclo={data.ciclo} />
              )}
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

function DistribuirPontos({ data, ciclo }: { data?: any[], ciclo?: any }) {
  const [producoes, setProducoes] = useState<any[]>([]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProducoes(data);
    }
  }, [data, ciclo]);

  const handleDistribuir = async (producaoId: string) => {
    try {
      const res = await fetch("/api/v1/gestor-pf/pontos/distribuir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producaoId }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao distribuir pontos");
        return;
      }

      toast.success(
        `${json.pontos} pontos distribuídos para ${json.parceiro.nome}!`,
      );

      // Recarregar lista
      const resAtualizada = await fetch(
        "/api/v1/gestor-pf/pontos/distribuir",
      );
      if (resAtualizada.ok) {
        const dados = await resAtualizada.json();
        setProducoes(dados.producoes || []);
      }
    } catch {
      toast.error("Erro ao distribuir pontos");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Distribuir Pontos por Produção
      </h2>

      {ciclo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Ciclo vigente:</strong> {ciclo.nome}
          </p>
        </div>
      )}

      {!producoes || producoes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma produção encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {producoes.map((producao: any) => (
            <div
              key={producao.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900">
                    {producao.paciente}
                  </span>
                  {producao.pontosDistribuidos && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                      ✓ {producao.pontosDistribuidos.pontos} pts distribuídos
                    </span>
                  )}
                  {!producao.pontosDistribuidos && producao.pontosPotenciais > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                      💰 {producao.pontosPotenciais} pts a distribuir
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-gray-600">
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Procedimento:</span>{" "}
                    <span className="truncate block">{producao.procedimento}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Parceiro:</span>{" "}
                    <span className="font-medium">{producao.parceiro?.nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>{" "}
                    <span className="font-semibold text-green-600">R$ {producao.totalPago}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>{" "}
                    {new Date(producao.dataReferencia || producao.dataProcedimento).toLocaleDateString(
                      "pt-BR",
                    )}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-3">
                {producao.pontosDistribuidos ? (
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Distribuído</span>
                    <span className="text-lg font-bold text-green-600">{producao.pontosDistribuidos.pontos} pts</span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Pontos</span>
                    <span className="text-lg font-bold text-yellow-600">{producao.pontosPotenciais || 0} pts</span>
                  </div>
                )}
                {!producao.pontosDistribuidos && (
                  <button
                    onClick={() => handleDistribuir(producao.id)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                  >
                    Distribuir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CiclosPontos({ data }: { data?: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ciclos de Pontos</h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum ciclo criado
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((ciclo: any) => (
            <div
              key={ciclo.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ciclo.nome}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")}
                    {" a "}
                    {new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${
                      ciclo.periodicidade === "SEMESTRAL"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {ciclo.periodicidade === "SEMESTRAL"
                      ? "📆 Semestral"
                      : "📆 Anual"}
                  </span>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded font-semibold ${
                    ciclo.status === "EM_ANDAMENTO"
                      ? "bg-green-100 text-green-700"
                      : ciclo.status === "RESGATE_ABERTO"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ciclo.status === "EM_ANDAMENTO"
                    ? "🟢 EM_ANDAMENTO"
                    : ciclo.status === "RESGATE_ABERTO"
                      ? "🟡 RESGATE_ABERTO"
                      : "⚫ ENCERRADO"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <CriarCicloForm />
    </div>
  );
}

function CriarCicloForm() {
  const [nome, setNome] = useState("");
  const [periodicidade, setPeriodicidade] = useState<"SEMESTRAL" | "ANUAL">(
    "ANUAL",
  );
  const [inicio, setInicio] = useState("");
  const [fimAcumulo, setFimAcumulo] = useState("");
  const [fimResgate, setFimResgate] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleCriar() {
    if (
      !nome ||
      !inicio ||
      !fimAcumulo ||
      !fimResgate ||
      !periodicidade
    ) {
      toast.error("Preencha todos os campos do ciclo");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/pontos/ciclos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          periodicidade,
          inicioAcumuloEm: new Date(inicio).toISOString(),
          fimAcumuloEm: new Date(fimAcumulo).toISOString(),
          fimResgateEm: new Date(fimResgate).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao criar ciclo");
        return;
      }
      toast.success("Ciclo criado com sucesso!");
      setNome("");
      setInicio("");
      setFimAcumulo("");
      setFimResgate("");
    } catch {
      toast.error("Erro ao criar ciclo");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-6">
      <h3 className="font-semibold text-gray-900 mb-3">Criar novo ciclo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            placeholder="Ex: 2026 - 1º Semestre"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Periodicidade
          </label>
          <select
            value={periodicidade}
            onChange={(e) =>
              setPeriodicidade(e.target.value as "SEMESTRAL" | "ANUAL")
            }
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          >
            <option value="ANUAL">Anual</option>
            <option value="SEMESTRAL">Semestral</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Início do acúmulo
          </label>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Fim do acúmulo
          </label>
          <input
            type="date"
            value={fimAcumulo}
            onChange={(e) => setFimAcumulo(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Fim do resgate
          </label>
          <input
            type="date"
            value={fimResgate}
            onChange={(e) => setFimResgate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
          />
        </div>
      </div>
      <button
        onClick={handleCriar}
        disabled={salvando}
        className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {salvando ? "Criando..." : "Criar ciclo"}
      </button>
    </div>
  );
}

function ConfiguracaoPontos({ data }: { data?: any[] }) {
  const config = Array.isArray(data) && data.length > 0 ? data[0] : null;

  const [formData, setFormData] = useState({
    valorPorPonto: config?.valorPorPonto || "0",
    tipoArredondamento: config?.tipoArredondamento || "PADRAO",
  });
  const [salvando, setSalvando] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.valorPorPonto || parseFloat(formData.valorPorPonto) <= 0) {
      toast.error("Valor por ponto deve ser positivo");
      return;
    }

    setSalvando(true);
    try {
      const endpoint = config?.id
        ? `/api/v1/gestor-pf/pontos/configuracao?id=${config.id}`
        : "/api/v1/gestor-pf/pontos/configuracao";

      const method = config?.id ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorPorPonto: parseFloat(formData.valorPorPonto),
          tipoArredondamento: formData.tipoArredondamento,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar configurações");
        return;
      }

      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Configuração do Sistema de Pontos
      </h2>
      <div className="space-y-6 max-w-2xl">
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Valor por Ponto (R$)
          </label>
          <input
            type="number"
            value={formData.valorPorPonto}
            onChange={(e) => handleChange("valorPorPonto", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Valor monetário atribuído a cada ponto
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Tipo de Arredondamento
          </label>
          <select
            value={formData.tipoArredondamento}
            onChange={(e) => handleChange("tipoArredondamento", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="PADRAO">Padrão</option>
            <option value="PISO">Piso</option>
            <option value="TETO">Teto</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Regra de arredondamento aplicada aos cálculos
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={salvando}
          className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "💾 Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}

function PremiosPontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Prêmios Cadastrados
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum prêmio cadastrado
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((premio: any) => (
            <div
              key={premio.id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900">{premio.nome}</p>
                <p className="text-sm text-gray-600">{premio.descricao}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary-600">
                  {premio.custoPontos} pts
                </p>
                <p className="text-xs text-gray-500">
                  Ativo: {premio.ativo ? "Sim" : "Não"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RankingPontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Ranking de Parceiros
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum dado disponível
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item: any, idx: number) => (
            <div
              key={item.posicao || idx}
              className={`flex items-center justify-between p-4 rounded-lg ${idx < 3 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">
                  {idx === 0
                    ? "🥇"
                    : idx === 1
                      ? "🥈"
                      : idx === 2
                        ? "🥉"
                        : `#${idx + 1}`}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.parceiro?.nome || item.nome}
                  </p>
                  <p className="text-xs text-gray-500">{item.posicao}º lugar</p>
                </div>
              </div>
              <p className="text-xl font-bold text-primary-600">
                {item.pontosAcumulados ?? item.pontos ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResgatePontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Resgates de Prêmios
      </h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum resgate registrado
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item: any) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {item.parceiro?.nome || item.parceiro}
                </p>
                <p className="text-sm text-gray-600">
                  {item.premio?.nome || item.premio}
                </p>
                <p className="text-xs text-gray-500">
                  {item.solicitadoEm
                    ? new Date(item.solicitadoEm).toLocaleDateString("pt-BR")
                    : item.data}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    item.status === "ENTREGUE"
                      ? "bg-green-100 text-green-700"
                      : item.status === "APROVADO"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status === "ENTREGUE"
                    ? "✓ Entregue"
                    : item.status === "APROVADO"
                      ? "Aprovado"
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

