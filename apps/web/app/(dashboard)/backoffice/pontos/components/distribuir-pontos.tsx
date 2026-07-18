"use client";

import { useState, useEffect } from "react";
import { TabelaDistribuicao } from "./tabela-distribuicao";

interface DistribuirPontosProps {
  data?: any[];
  ciclo?: any;
}

export function DistribuirPontos({ data, ciclo }: DistribuirPontosProps) {
  const [producoes, setProducoes] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProducoes(data);
    }
  }, [data, ciclo, refreshKey]);

  const handleRefresh = async () => {
    const resAtualizada = await fetch("/api/v1/backoffice/pontos/distribuir");
    if (resAtualizada.ok) {
      const dados = await resAtualizada.json();
      setProducoes(dados.producoes || []);
    }
  };

  return (
    <TabelaDistribuicao
      data={producoes}
      ciclo={ciclo}
      onDistribuir={() => setRefreshKey((prev) => prev + 1)}
      onAtualizar={handleRefresh}
    />
  );
}
