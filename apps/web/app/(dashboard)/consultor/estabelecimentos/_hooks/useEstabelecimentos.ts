"use client";

import { useEffect, useState } from "react";
import {
  Estabelecimento,
  EstabelecimentoFormData,
  initialFormData,
  validarCNPJ,
  validarChavePix,
} from "../lib/utils";

interface ConviteModalData {
  estabId: string;
  nomeFantasia: string;
  link: string;
}

export function useEstabelecimentos() {
  const [estabs, setEstabs] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EstabelecimentoFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [conviteModal, setConviteModal] = useState<ConviteModalData | null>(null);
  const [gerandoConvite, setGerandoConvite] = useState<string | null>(null);
  const [copiadoConvite, setCopiadoConvite] = useState(false);

  const loadEstabs = () => {
    fetch("/api/v1/consultor/estabelecimentos")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEstabs(data);
        } else {
          setEstabs([]);
        }
      })
      .catch(() => setEstabs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEstabs();
  }, []);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!form.nomeFantasia.trim()) {
      errors.nomeFantasia = "Nome fantasia é obrigatório";
    }

    const digits = form.cnpj.replace(/\D/g, "");
    if (digits.length > 0 && !validarCNPJ(form.cnpj)) {
      errors.cnpj = "CNPJ inválido";
    }

    if (form.pixChave && form.pixTipo && !validarChavePix(form.pixChave, form.pixTipo)) {
      errors.pixChave = "Chave PIX inválida para o tipo selecionado";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setFieldErrors({});
    setSubmitting(true);
    setMsg("");

    const res = await fetch("/api/v1/consultor/estabelecimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setMsg(
        "Estabelecimento cadastrado! Clique em 'Gerar Acesso' para criar o link de cadastro de senha."
      );
      setForm(initialFormData());
      setShowForm(false);
      loadEstabs();
    } else {
      const err = await res.json();
      if (err.error && err.error.includes("CNPJ")) {
        setFieldErrors({ cnpj: err.error });
      } else {
        setMsg(err.error || "Erro ao cadastrar");
      }
    }

    setSubmitting(false);
  }

  async function handleUpload(estabId: string, file: File, tipo: string) {
    setUploadingId(estabId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", tipo);

    const res = await fetch(
      `/api/v1/consultor/estabelecimentos/${estabId}/documentos`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (res.ok) {
      setMsg("Documento enviado!");
      loadEstabs();
    } else {
      const err = await res.json();
      setMsg(err.error || "Erro no upload");
    }

    setUploadingId(null);
  }

  async function gerarConvite(estabId: string, nomeFantasia: string) {
    setGerandoConvite(estabId);
    const res = await fetch(
      `/api/v1/consultor/estabelecimentos/${estabId}/gerar-acesso`,
      { method: "POST" }
    );

    if (res.ok) {
      const data = await res.json();
      setConviteModal({ estabId, nomeFantasia, link: data.link });
      setCopiadoConvite(false);
    } else {
      setMsg("Erro ao gerar link de acesso");
    }

    setGerandoConvite(null);
  }

  async function copiarLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiadoConvite(true);
      setTimeout(() => setCopiadoConvite(false), 3000);
    } catch {
      const el = document.querySelector<HTMLInputElement>("#convite-link-input");
      el?.select();
    }
  }

  async function downloadQR(estabId: string) {
    const res = await fetch(
      `/api/v1/consultor/estabelecimentos/${estabId}/qrcode`
    );

    if (res.ok) {
      const data = await res.json();
      const link = document.createElement("a");
      link.href = data.qrCode;
      link.download = `qrcode-${data.codigoCupom}.png`;
      link.click();
    }
  }

  function resetForm() {
    setForm(initialFormData());
    setFieldErrors({});
  }

  return {
    estabs,
    loading,
    showForm,
    setShowForm,
    form,
    setForm,
    submitting,
    msg,
    setMsg,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    uploadingId,
    conviteModal,
    setConviteModal,
    gerandoConvite,
    copiadoConvite,
    handleSubmit,
    handleUpload,
    gerarConvite,
    copiarLink,
    downloadQR,
    resetForm,
  };
}
