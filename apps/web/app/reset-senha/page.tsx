"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { validatePasswordStrength } from "@/lib/password-reset";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  const [validating, setValidating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ email?: string; nome?: string }>(
    {},
  );
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    validateToken();
  }, [token, type]);

  const validateToken = async () => {
    if (!token || !type) {
      setError("Link inválido");
      setValidating(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/auth/validate-reset-token?token=${token}&type=${type}`,
      );
      const data = await response.json();

      if (data.valid) {
        setValid(true);
        setUserData({ email: data.email, nome: data.nome });
      } else {
        setError(data.error || "Link inválido ou expirado");
      }
    } catch (err) {
      setError("Erro ao validar link");
    } finally {
      setValidating(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });

    if (password) {
      const validation = validatePasswordStrength(password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password) {
      toast.error("Digite uma senha");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    const validation = validatePasswordStrength(formData.password);
    if (!validation.valid) {
      toast.error("Senha não atende aos requisitos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          type,
          novaSenha: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setSuccess(true);
      toast.success("Senha redefinida com sucesso!");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao redefinir senha",
      );
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">
              Link Inválido
            </h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">Sucesso!</h2>
          </div>
          <p className="text-green-700 mb-4">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o
            login em alguns segundos...
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full"
            variant="default"
          >
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="rounded-lg border bg-white p-8">
        <h1 className="text-2xl font-bold mb-2">Redefinir Senha</h1>
        <p className="text-gray-600 mb-6">Para: {userData.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nova Senha</label>
            <Input
              type="password"
              value={formData.password}
              onChange={handlePasswordChange}
              placeholder="Digite sua nova senha"
              required
            />
            {passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((error) => (
                  <p key={error} className="text-xs text-red-600">
                    • {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirmar Senha
            </label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Confirme sua nova senha"
              required
            />
            {formData.password &&
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-xs text-red-600">
                  As senhas não conferem
                </p>
              )}
          </div>

          <Button
            type="submit"
            disabled={loading || passwordErrors.length > 0}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
