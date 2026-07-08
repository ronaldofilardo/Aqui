"use client";

import { CriarCicloForm } from "./criar-ciclo-form";

export function CiclosPontos({ data }: { data?: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ciclos de Pontos</h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum ciclo criado</div>
      ) : (
        <div className="space-y-4">
          {data.map((ciclo: any) => (
            <div key={ciclo.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ciclo.nome}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")}
                    {" a "}
                    {new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${
                    ciclo.periodicidade === "SEMESTRAL"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {ciclo.periodicidade === "SEMESTRAL" ? "📆 Semestral" : "📆 Anual"}
                  </span>
                </div>
                <span className={`text-xs px-3 py-1 rounded font-semibold ${
                  ciclo.status === "EM_ANDAMENTO" ? "bg-green-100 text-green-700" :
                  ciclo.status === "RESGATE_ABERTO" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {ciclo.status === "EM_ANDAMENTO" ? "🟢 EM_ANDAMENTO" :
                   ciclo.status === "RESGATE_ABERTO" ? "🟡 RESGATE_ABERTO" : "⚫ ENCERRADO"}
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
