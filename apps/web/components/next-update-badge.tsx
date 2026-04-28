"use client";

import { useEffect, useState } from "react";

function proximaSegundaFeira12hBRT(): Date {
  // Obtém data atual em BRT (UTC-3)
  const agora = new Date();
  const brtOffset = -3 * 60; // -3h em minutos
  const utcMs = agora.getTime() + agora.getTimezoneOffset() * 60000;
  const brtDate = new Date(utcMs + brtOffset * 60000);

  const diaSemana = brtDate.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  const hora = brtDate.getHours();
  const minutos = brtDate.getMinutes();

  // Se hoje é segunda (1) e ainda não passou 12h
  const ehSegundaAntesDoMeiodia =
    diaSemana === 1 && (hora < 12 || (hora === 12 && minutos === 0));

  let diasAteProximaSegunda: number;
  if (ehSegundaAntesDoMeiodia) {
    diasAteProximaSegunda = 0;
  } else {
    // Dias até a próxima segunda
    diasAteProximaSegunda = diaSemana === 0 ? 1 : 8 - diaSemana;
  }

  const proximaSegunda = new Date(brtDate);
  proximaSegunda.setDate(brtDate.getDate() + diasAteProximaSegunda);
  proximaSegunda.setHours(12, 0, 0, 0);

  return proximaSegunda;
}

export function NextUpdateBadge() {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const proxima = proximaSegundaFeira12hBRT();
    const opcoesDia: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "2-digit",
      month: "short",
    };
    const diaLabel = proxima
      .toLocaleDateString("pt-BR", opcoesDia)
      .replace(".", "")
      .toUpperCase();

    setLabel(`${diaLabel} 12:00`);
  }, []);

  if (!label) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Próxima atualização em: <span className="font-semibold">{label}</span>
    </div>
  );
}
