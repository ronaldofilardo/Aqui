const ASAAS_API_URL = process.env.ASAAS_SANDBOX === "true"
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/api/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Erro na API Asaas" }));
    throw new Error(error.errors?.[0]?.description || error.message || "Erro na API Asaas");
  }

  return res.json();
}

export async function criarTransferenciaPix(params: {
  pixChave: string;
  pixTipo: string;
  valor: number;
  descricao: string;
}) {
  return asaasFetch("/transfers", {
    method: "POST",
    body: JSON.stringify({
      value: params.valor,
      operationType: "PIX",
      pixAddressKey: params.pixChave,
      pixAddressKeyType: params.pixTipo,
      description: params.descricao,
    }),
  });
}

export async function consultarTransferencia(transferId: string) {
  return asaasFetch(`/transfers/${transferId}`);
}
