import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// ---------------------------------------------------------------------------
// Lógica pura extraída do componente NextUpdateBadge para teste
// ---------------------------------------------------------------------------

function proximaSegundaFeira12hBRT(agora: Date): Date {
  const brtOffset = -3 * 60;
  const utcMs = agora.getTime() + agora.getTimezoneOffset() * 60000;
  const brtDate = new Date(utcMs + brtOffset * 60000);

  const diaSemana = brtDate.getDay();
  const hora = brtDate.getHours();
  const minutos = brtDate.getMinutes();

  const ehSegundaAntesDoMeiodia =
    diaSemana === 1 && (hora < 12 || (hora === 12 && minutos === 0));

  let diasAteProximaSegunda: number;
  if (ehSegundaAntesDoMeiodia) {
    diasAteProximaSegunda = 0;
  } else {
    diasAteProximaSegunda = diaSemana === 0 ? 1 : 8 - diaSemana;
  }

  const proximaSegunda = new Date(brtDate);
  proximaSegunda.setDate(brtDate.getDate() + diasAteProximaSegunda);
  proximaSegunda.setHours(12, 0, 0, 0);

  return proximaSegunda;
}

// Helpers para criar datas em BRT fictícias (simulando UTC input que resulta em BRT esperado)
function brtDate(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto = 0,
): Date {
  // Cria um Date em UTC tal que, quando convertido para BRT (UTC-3), mostra a hora desejada
  return new Date(Date.UTC(ano, mes - 1, dia, hora + 3, minuto, 0));
}

describe("proximaSegundaFeira12hBRT — segunda antes das 12h", () => {
  it("segunda-feira às 10h BRT → mesmo dia às 12h", () => {
    const input = brtDate(2026, 4, 27, 10); // 27/04/2026 = segunda-feira
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1); // segunda
    expect(result.getHours()).toBe(12);
    expect(result.getDate()).toBe(27);
  });

  it("segunda-feira às 12h00 BRT → mesmo dia (exatamente 12h)", () => {
    const input = brtDate(2026, 4, 27, 12, 0);
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDate()).toBe(27);
    expect(result.getHours()).toBe(12);
  });
});

describe("proximaSegundaFeira12hBRT — segunda após as 12h", () => {
  it("segunda-feira às 13h BRT → próxima segunda-feira", () => {
    const input = brtDate(2026, 4, 27, 13);
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4); // 04/05/2026 = próxima segunda
    expect(result.getHours()).toBe(12);
  });
});

describe("proximaSegundaFeira12hBRT — outros dias da semana", () => {
  it("terça-feira → próxima segunda-feira", () => {
    const input = brtDate(2026, 4, 28, 10); // 28/04/2026 = terça
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4); // 04/05/2026
    expect(result.getHours()).toBe(12);
  });

  it("quarta-feira → próxima segunda-feira", () => {
    const input = brtDate(2026, 4, 29, 9); // 29/04/2026 = quarta
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4);
  });

  it("sexta-feira → próxima segunda-feira", () => {
    const input = brtDate(2026, 5, 1, 8); // 01/05/2026 = sexta
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4);
  });

  it("sábado → próxima segunda-feira", () => {
    const input = brtDate(2026, 5, 2, 15); // 02/05/2026 = sábado
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4);
  });

  it("domingo → segunda-feira seguinte", () => {
    const input = brtDate(2026, 5, 3, 20); // 03/05/2026 = domingo
    const result = proximaSegundaFeira12hBRT(input);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4);
    expect(result.getHours()).toBe(12);
  });
});

describe("proximaSegundaFeira12hBRT — resultado sempre às 12h", () => {
  it("resultado sempre tem hora = 12 e minuto = 0", () => {
    const dias = [
      brtDate(2026, 4, 27, 10), // segunda antes do meio-dia
      brtDate(2026, 4, 27, 14), // segunda depois do meio-dia
      brtDate(2026, 4, 28, 9), // terça
      brtDate(2026, 4, 30, 23), // quinta
      brtDate(2026, 5, 3, 1), // domingo
    ];
    dias.forEach((d) => {
      const result = proximaSegundaFeira12hBRT(d);
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });
});
