import type {
  CupomImportadoLinha,
  ImportacaoErro,
  ImportacaoResultado,
} from "../types";
import { CAMPANHA_PADRAO } from "../constants";
import { validarCPF } from "../schemas";

function detectDelimiter(firstLine: string): string {
  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes(";")) return ";";
  return ",";
}

function parseDecimalBR(value: string): number {
  const cleaned = value.trim().replace(/\s/g, "");
  // Handle Brazilian format: 111,11 → 111.11
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized);
}

function parsePercentage(value: string): number {
  const cleaned = value.trim().replace("%", "").replace(",", ".");
  return parseFloat(cleaned);
}

function parseDateBR(value: string): Date | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  if (date.getDate() !== day) return null; // rejeita datas inválidas como 31/02
  return date;
}

export function parseCupomFile(content: string): ImportacaoResultado {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      totalLinhas: 0,
      importados: 0,
      erros: [
        { linha: 0, campo: "arquivo", mensagem: "Arquivo vazio ou sem dados" },
      ],
      dados: [],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  // Skip header
  const dataLines = lines.slice(1);
  const erros: ImportacaoErro[] = [];
  const dados: CupomImportadoLinha[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const cols = line.split(delimiter).map((c) => c.trim());
    const linhaNum = i + 2; // +2 because header is line 1

    if (cols.length < 10) {
      erros.push({
        linha: linhaNum,
        campo: "formato",
        mensagem: `Linha com ${cols.length} colunas, esperado 10`,
      });
      continue;
    }

    const [
      nomeCupom,
      paciente,
      campanha,
      local,
      servico,
      precoStr,
      descontoStr,
      agendamentoStr,
      recurso,
      cpfRaw,
    ] = cols;

    // Validate nome_cupom
    if (!nomeCupom) {
      erros.push({
        linha: linhaNum,
        campo: "nome_cupom",
        mensagem: "Nome do cupom é obrigatório",
      });
      continue;
    }

    // Validate paciente
    if (!paciente || paciente.length < 3) {
      erros.push({
        linha: linhaNum,
        campo: "paciente",
        mensagem: "Nome do paciente deve ter no mínimo 3 caracteres",
      });
      continue;
    }

    // Validate campanha
    if (campanha && campanha !== CAMPANHA_PADRAO) {
      erros.push({
        linha: linhaNum,
        campo: "campanha",
        mensagem: `Campanha deve ser '${CAMPANHA_PADRAO}'`,
      });
      continue;
    }

    // Validate local
    if (!local) {
      erros.push({
        linha: linhaNum,
        campo: "local",
        mensagem: "Local é obrigatório",
      });
      continue;
    }

    // Validate preco
    const preco = parseDecimalBR(precoStr);
    if (isNaN(preco) || preco <= 0 || preco > 10000) {
      erros.push({
        linha: linhaNum,
        campo: "preco",
        mensagem: "Preço deve ser entre 0 e 10.000",
      });
      continue;
    }

    // Validate desconto
    const desconto = parsePercentage(descontoStr);
    if (isNaN(desconto) || desconto < 0 || desconto > 100) {
      erros.push({
        linha: linhaNum,
        campo: "desconto",
        mensagem: "Desconto deve ser entre 0% e 100%",
      });
      continue;
    }

    // Validate agendamento
    const agendamento = parseDateBR(agendamentoStr);
    if (!agendamento) {
      erros.push({
        linha: linhaNum,
        campo: "agendamento",
        mensagem: "Data de agendamento inválida, use dd/mm/aaaa",
      });
      continue;
    }

    // Validate CPF
    const cpf = cpfRaw.replace(/\D/g, "");
    if (!cpf || !validarCPF(cpf)) {
      erros.push({
        linha: linhaNum,
        campo: "cpf",
        mensagem: "CPF do paciente inválido",
      });
      continue;
    }

    dados.push({
      nomeCupom,
      paciente,
      campanha: campanha || CAMPANHA_PADRAO,
      local,
      servico: servico || "Cupom",
      preco,
      desconto,
      agendamento,
      recurso: recurso || "",
      cpf,
    });
  }

  return {
    totalLinhas: dataLines.filter((l) => l.trim()).length,
    importados: dados.length,
    erros,
    dados,
  };
}
