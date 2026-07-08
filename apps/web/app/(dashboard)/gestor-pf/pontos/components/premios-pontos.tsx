"use client";

export function PremiosPontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Prêmios</h2>
      {!data || data.length === 0 ? (
        <p className="text-gray-500">Nenhum prêmio disponível</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((premio: any) => (
            <div key={premio.id} className="border p-4 rounded-lg">
              <h3 className="font-semibold">{premio.nome}</h3>
              <p className="text-sm text-gray-600">Pontos: {premio.pontos}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
