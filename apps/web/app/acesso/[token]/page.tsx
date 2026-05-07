"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AcessoPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<
    "loading" | "invalid" | "processing" | "redirecting"
  >("loading");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Guard contra double-effect do React StrictMode em desenvolvimento
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function processToken() {
      if (!token) {
        setStatus("invalid");
        return;
      }

      setStatus("processing");

      try {
        // Detectar tipo de token pelo formato:
        // - Invite token (HMAC):  base64url.base64url  (contém ponto)
        // - Reset token (hex):    64 chars hex          (sem ponto — fluxo consultor/usuário)
        const isInviteToken = token.includes(".");

        if (isInviteToken) {
          // Fluxo estabelecimento: validar HMAC + criar/reutilizar UsuarioEstabelecimento
          const res = await fetch(
            "/api/auth/estabelecimento/acesso-automatico",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inviteToken: token }),
            },
          );

          const data = await res.json();

          if (!res.ok) {
            setErrorMsg(data.error || "Link inválido ou expirado");
            setStatus("invalid");
            return;
          }

          if (data.nomeFantasia) setNomeFantasia(data.nomeFantasia);

          setStatus("redirecting");
          router.push(data.link);
        } else {
          // Fluxo consultor/usuário: reset token hex — validar e redirecionar direto
          const res = await fetch(
            `/api/auth/validate-reset-token?token=${encodeURIComponent(token)}&type=USUARIO`,
          );
          const data = await res.json();

          if (!res.ok || !data.valid) {
            setErrorMsg(data.error || "Link inválido ou expirado");
            setStatus("invalid");
            return;
          }

          setStatus("redirecting");
          router.push(
            `/reset-senha?token=${encodeURIComponent(token)}&type=USUARIO`,
          );
        }
      } catch (err) {
        console.error("[acesso] Erro ao processar token:", err);
        setErrorMsg("Erro ao processar seu acesso. Tente novamente.");
        setStatus("invalid");
      }
    }

    processToken();
  }, [token, router]);

  if (status === "loading" || status === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 text-sm">
            {status === "loading"
              ? "Verificando link..."
              : "Preparando seu acesso..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "redirecting") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          {nomeFantasia && (
            <p className="text-gray-700 text-sm font-medium mb-1">
              {nomeFantasia}
            </p>
          )}
          <p className="text-gray-500 text-sm">
            Preparando definição de senha...
          </p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-gray-500 text-sm">
            {errorMsg ||
              "Este link não é mais válido. Solicite um novo ao seu consultor."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
