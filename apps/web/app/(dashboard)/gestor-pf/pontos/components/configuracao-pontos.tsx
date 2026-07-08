"use client";

export function ConfiguracaoPontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Configuração de Pontos</h2>
      {!data || data.length === 0 ? (
        <p className="text-gray-500">Nenhuma configuração encontrada</p>
      ) : (
        <div className="space-y-4">
          {data.map((config: any) => (
            <div key={config.id} className="border p-4 rounded-lg">
              <h3 className="font-semibold">{config.nome}</h3>
              <p className="text-sm text-gray-600">Pontos: {config.pontos}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
