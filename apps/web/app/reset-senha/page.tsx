"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [openModal, setOpenModal] = useState(true);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setOpenModal(false);
      router.push("/login");
    } else {
      validateToken();
    }
  }, [token, type, router]);

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
        setOpenModal(false);
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

  const handleCloseModal = () => {
    setOpenModal(false);
    router.push("/login");
  };

  // Invalid token or error state
  if (!validating && !valid) {
    return (
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <DialogTitle>Link Inválido</DialogTitle>
            </div>
            <DialogDescription className="text-red-600 mt-4">
              {error || "Link inválido ou expirado"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCloseModal} variant="outline">
              Voltar ao Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  if (success) {
    return (
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <DialogTitle>Sucesso!</DialogTitle>
            </div>
            <DialogDescription className="text-green-600 mt-4">
              Sua senha foi redefinida com sucesso. Você será redirecionado para
              o login em alguns segundos...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCloseModal}>Ir para Login</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Reset form state
  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
          <DialogDescription>
            Crie uma nova senha para a conta {userData.email}
          </DialogDescription>
        </DialogHeader>

        {validating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nova Senha
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={handlePasswordChange}
                placeholder="Digite sua nova senha"
                required
                disabled={loading}
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
                disabled={loading}
              />
              {formData.password &&
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-600">
                    As senhas não conferem
                  </p>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || passwordErrors.length > 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
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
