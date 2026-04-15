"use client";

import { useEffect, useState } from "react";

interface CupomInfo {
  id: string;
  codigo: string;
  nomePaciente: string;
  campanha: string;
  precoOriginal: string;
  precoFinal: string;
  descontoPercentual: string;
  servico: string;
  status: string;
  estabelecimento: {
    nomeFantasia: string;
    endereco: string;
    cidade: string;
    estado: string;
  } | null;
}

export default function ValidarCupomPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const [cupom, setCupom] = useState<CupomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [nomePaciente, setNomePaciente] = useState("");
  const [dataConsulta, setDataConsulta] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    params.then((p) => {
      setCodigo(p.codigo);
      fetch(`/api/v1/public/validar-cupom/${encodeURIComponent(p.codigo)}`)
        .then((r) => {
          if (!r.ok) throw new Error("Cupom inválido ou indisponível");
          return r.json();
        })
        .then((data) => {
          setCupom(data.cupom);
          setNomePaciente(data.cupom.nomePaciente || "");
        })
        .catch((e) => setErro(e.message))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function handleAgendar(e: React.FormEvent) {
    e.preventDefault();
    if (!cupom) return;
    setAgendando(true);
    const res = await fetch("/api/v1/public/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cupomCodigo: codigo,
        nomePaciente,
        dataConsulta: new Date(dataConsulta).toISOString(),
      }),
    });
    if (res.ok) {
      setSucesso(true);
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao agendar");
    }
    setAgendando(false);
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Validando cupom...</p>
      </div>
    );

  if (erro && !cupom)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">&#10060;</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Cupom Inválido
          </h1>
          <p className="text-gray-500">{erro}</p>
        </div>
      </div>
    );

  if (sucesso)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">&#9989;</div>
          <h1 className="text-xl font-bold text-green-600 mb-2">
            Consulta Agendada!
          </h1>
          <p className="text-gray-500">
            Seu agendamento foi realizado com sucesso.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-primary-700 mb-2">
          Acesso Saúde Aqui
        </h1>
        <p className="text-gray-500 text-sm mb-6">Validação de Cupom</p>

        {cupom && (
          <>
            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-primary-600 uppercase font-medium">
                  Cupom
                </span>
                <span className="font-bold text-primary-800">
                  {cupom.codigo}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Serviço:</span>
                  <span className="font-medium">{cupom.servico}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Campanha:</span>
                  <span>{cupom.campanha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço Original:</span>
                  <span className="line-through text-gray-400">
                    R$ {Number(cupom.precoOriginal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="text-green-600 font-medium">
                    {Number(cupom.descontoPercentual).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-800 font-medium">
                    Preço Final:
                  </span>
                  <span className="font-bold text-green-700">
                    R$ {Number(cupom.precoFinal).toFixed(2)}
                  </span>
                </div>
              </div>
              {cupom.estabelecimento && (
                <div className="mt-3 pt-3 border-t border-primary-100 text-xs text-gray-600">
                  <p className="font-medium">
                    {cupom.estabelecimento.nomeFantasia}
                  </p>
                  <p>
                    {cupom.estabelecimento.endereco} -{" "}
                    {cupom.estabelecimento.cidade}/
                    {cupom.estabelecimento.estado}
                  </p>
                </div>
              )}
            </div>

            {cupom.status === "DISPONIVEL" && (
              <form onSubmit={handleAgendar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Paciente
                  </label>
                  <input
                    type="text"
                    required
                    value={nomePaciente}
                    onChange={(e) => setNomePaciente(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data da Consulta
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dataConsulta}
                    onChange={(e) => setDataConsulta(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                {erro && <p className="text-red-500 text-sm">{erro}</p>}
                <button
                  type="submit"
                  disabled={agendando}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
                >
                  {agendando ? "Agendando..." : "Agendar Consulta"}
                </button>
              </form>
            )}

            {cupom.status !== "DISPONIVEL" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-700 font-medium">
                  Este cupom já foi utilizado.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
