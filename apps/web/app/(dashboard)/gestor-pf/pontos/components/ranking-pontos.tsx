"use client";

export function RankingPontos({ data }: { data?: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ranking</h2>
      {!data || data.length === 0 ? (
        <p className="text-gray-500">Ranking indisponível</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Parceiro</th>
              <th className="text-right p-2">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pos: any, i: number) => (
              <tr key={pos.id || i} className="border-b">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{pos.parceiro?.nome}</td>
                <td className="p-2 text-right font-semibold">{pos.pontos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
