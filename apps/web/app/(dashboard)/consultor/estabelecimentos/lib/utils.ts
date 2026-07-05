export interface Estabelecimento {
  id: string;
  nomeFantasia: string;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  pixChave?: string | null;
  pixTipo?: string | null;
  bancoNome?: string | null;
  agencia?: string | null;
  conta?: string | null;
  cupomConfig: { codigoCupom: string } | null;
  documentos: Array<{ id: string; tipo: string; nomeOriginal: string }>;
  _count: { comissoes: number; usuarios: number };
}

export interface EstabelecimentoFormData {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  responsavelNome: string;
  responsavelCpf: string;
  pixTipo: string;
  pixChave: string;
  bancoNome: string;
  agencia: string;
  conta: string;
}

export function initialFormData(): EstabelecimentoFormData {
  return {
    nomeFantasia: "",
    razaoSocial: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    telefone: "",
    email: "",
    responsavelNome: "",
    responsavelCpf: "",
    pixTipo: "",
    pixChave: "",
    bancoNome: "",
    agencia: "",
    conta: "",
  };
}

export function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function calcCNPJ(d: string, len: number): number {
  let sum = 0;
  let pos = len - 7;
  for (let i = len; i >= 1; i--) {
    sum += parseInt(d[len - i]) * pos--;
    if (pos < 2) pos = 9;
  }
  return sum % 11 < 2 ? 0 : 11 - (sum % 11);
}

export function validarCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  return calcCNPJ(d, 12) === parseInt(d[12]) && calcCNPJ(d, 13) === parseInt(d[13]);
}

export function validarChavePix(chave: string, tipo: string): boolean {
  if (!chave || !tipo) return true;
  const digits = chave.replace(/\D/g, "");

  if (tipo === "CPF") {
    const d = digits;
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const calc = (len: number): number => {
      let sum = 0;
      let pos = len + 1;
      for (let i = 0; i < len; i++) {
        sum += parseInt(d[i]) * pos--;
      }
      return sum % 11 < 2 ? 0 : 11 - (sum % 11);
    };
    return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
  }

  if (tipo === "CNPJ") {
    const d = digits;
    if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
    return calcCNPJ(d, 12) === parseInt(d[12]) && calcCNPJ(d, 13) === parseInt(d[13]);
  }

  if (tipo === "EMAIL") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);
  }

  if (tipo === "TELEFONE") {
    return digits.length >= 10;
  }

  return true;
}
