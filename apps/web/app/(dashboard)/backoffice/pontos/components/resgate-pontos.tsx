"use client";

export function ResgatePontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Resgates</h2>
      {!data || data.length === 0 ? (
        <p className="text-gray-500">Nenhum resgate encontrado</p>
      ) : (
        <div className="space-y-3">
          {data.map((resgate: any) => (
            <div key={resgate.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{resgate.premio?.nome || "Prêmio"}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(resgate.dataResgate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  resgate.status === "APROVADO" ? "bg-green-100 text-green-700" :
                  resgate.status === "PENDENTE" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {resgate.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

