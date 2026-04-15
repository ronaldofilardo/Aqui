"use client";

import { useEffect, useState } from "react";
import React from "react";
import { validarCPF } from "@asa/shared";

interface Cupom {
  id: string;
  codigoCupom: string;
  descricao: string | null;
  status: string;
  _count: { cuponsImportados: number };
}

interface Estabelecimento {
  id: string;
  nomeFantasia: string;
  cidade: string | null;
  estado: string | null;
  cupomConfig: Cupom | null;
}

interface CuponData {
  consultor: { id: string; nome: string; email: string };
  estabelecimentos: Estabelecimento[];
}

interface Consultor {
  id: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    status: string;
  };
  _count: { estabelecimentos: number };
  totalConsultas: number;
  totalComissoes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ConsultoresPage() {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedCupons, setExpandedCupons] = useState<string | null>(null);
  const [cuponData, setCuponData] = useState<{
    [key: string]: CuponData | null;
  }>({});
  const [loadingCupons, setLoadingCupons] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    cpf: "",
    telefone: "",
    pixChave: "",
    pixTipo: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const validarFormulario = (): boolean => {
    const novoErros: FormErrors = {};

    if (!form.nome.trim() || form.nome.length < 3) {
      novoErros.nome = "Nome deve ter no mínimo 3 caracteres";
    }

    if (!form.email.trim()) {
      novoErros.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      novoErros.email = "Email inválido";
    }

    if (!form.senha.trim() || form.senha.length < 6) {
      novoErros.senha = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!form.cpf.trim()) {
      novoErros.cpf = "CPF é obrigatório";
    } else if (!validarCPF(form.cpf)) {
      novoErros.cpf = "CPF inválido";
    }

    if (form.telefone.trim()) {
      const telefoneLimpo = form.telefone.replace(/\D/g, "");
      if (telefoneLimpo.length < 10) {
        novoErros.telefone = "Telefone inválido";
      }
    }

    if (form.pixChave.trim() && form.pixTipo) {
      if (form.pixTipo === "CPF") {
        const cpfLimpo = form.pixChave.replace(/\D/g, "");
        if (cpfLimpo.length !== 11) {
          novoErros.pixChave = "CPF inválido para a chave PIX";
        }
      } else if (form.pixTipo === "CNPJ") {
        const cnpjLimpo = form.pixChave.replace(/\D/g, "");
        if (cnpjLimpo.length !== 14) {
          novoErros.pixChave = "CNPJ inválido para a chave PIX";
        }
      } else if (form.pixTipo === "EMAIL") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.pixChave)) {
          novoErros.pixChave = "Email inválido para a chave PIX";
        }
      } else if (form.pixTipo === "TELEFONE") {
        const telLimpo = form.pixChave.replace(/\D/g, "");
        if (telLimpo.length < 10) {
          novoErros.pixChave = "Telefone inválido para a chave PIX";
        }
      }
    }

    setErrors(novoErros);
    return Object.keys(novoErros).length === 0;
  };

  const loadConsultores = () => {
    fetch("/api/v1/gestor/consultores")
      .then((r) => r.json())
      .then(setConsultores)
      .finally(() => setLoading(false));
  };

  const toggleCupons = async (consultorId: string) => {
    if (expandedCupons === consultorId) {
      setExpandedCupons(null);
      return;
    }

    if (!cuponData[consultorId]) {
      setLoadingCupons(true);
      const res = await fetch(
        `/api/v1/gestor/consultores/${consultorId}/cupons`,
      );
      const data = await res.json();
      setCuponData((prev) => ({ ...prev, [consultorId]: data }));
      setLoadingCupons(false);
    }

    setExpandedCupons(consultorId);
  };

  useEffect(() => {
    loadConsultores();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validarFormulario()) {
      setMsg("");
      return;
    }

    setSubmitting(true);
    setMsg("");

    const res = await fetch("/api/v1/gestor/consultores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        pixTipo: form.pixTipo || undefined,
      }),
    });

    if (res.ok) {
      setMsg("Consultor cadastrado com sucesso!");
      setForm({
        nome: "",
        email: "",
        senha: "",
        cpf: "",
        telefone: "",
        pixChave: "",
        pixTipo: "",
      });
      setErrors({});
      setShowForm(false);
      loadConsultores();
    } else {
      const err = await res.json();
      setMsg(err.error || "Erro ao cadastrar");
    }
    setSubmitting(false);
  }

  async function toggleStatus(id: string, statusAtual: string) {
    const novoStatus = statusAtual === "ATIVO" ? "INATIVO" : "ATIVO";
    await fetch(`/api/v1/gestor/consultores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    loadConsultores();
  }

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const novoErros = { ...prev };
        delete novoErros[field];
        return novoErros;
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consultores</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Consultor"}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes("sucesso") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {msg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => handleFormChange("nome", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.nome ? "border-red-500" : ""}`}
            />
            {errors.nome && (
              <p className="text-red-600 text-xs mt-1">{errors.nome}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              type="password"
              required
              value={form.senha}
              onChange={(e) => handleFormChange("senha", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.senha ? "border-red-500" : ""}`}
            />
            {errors.senha && (
              <p className="text-red-600 text-xs mt-1">{errors.senha}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF *
            </label>
            <input
              type="text"
              required
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => handleFormChange("cpf", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.cpf ? "border-red-500" : ""}`}
            />
            {errors.cpf && (
              <p className="text-red-600 text-xs mt-1">{errors.cpf}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={(e) => handleFormChange("telefone", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.telefone ? "border-red-500" : ""}`}
            />
            {errors.telefone && (
              <p className="text-red-600 text-xs mt-1">{errors.telefone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo PIX
            </label>
            <select
              value={form.pixTipo}
              onChange={(e) => handleFormChange("pixTipo", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Selecione</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">Email</option>
              <option value="TELEFONE">Telefone</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave PIX
            </label>
            <input
              type="text"
              value={form.pixChave}
              onChange={(e) => handleFormChange("pixChave", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${errors.pixChave ? "border-red-500" : ""}`}
            />
            {errors.pixChave && (
              <p className="text-red-600 text-xs mt-1">{errors.pixChave}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Salvando..." : "Cadastrar Consultor"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Estabelecimentos
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Consultas
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {consultores.map((c) => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{c.usuario.nome}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.usuario.email}
                    </td>
                    <td className="px-6 py-4">{c._count.estabelecimentos}</td>
                    <td className="px-6 py-4">{c.totalConsultas}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${c.usuario.status === "ATIVO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {c.usuario.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <button
                        onClick={() => toggleCupons(c.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <span>{expandedCupons === c.id ? "▼" : "▶"}</span>
                        <span>Cupons</span>
                      </button>
                      <button
                        onClick={() => toggleStatus(c.id, c.usuario.status)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        {c.usuario.status === "ATIVO" ? "Inativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>

                  {expandedCupons === c.id && (
                    <tr className="bg-gray-50 hover:bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        {loadingCupons ? (
                          <p className="text-gray-500 text-sm">
                            Carregando cupons...
                          </p>
                        ) : cuponData[c.id]?.estabelecimentos?.length === 0 ? (
                          <p className="text-gray-500 text-sm">
                            Nenhum estabelecimento cadastrado
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {cuponData[c.id]?.estabelecimentos?.map((est) => (
                              <div
                                key={est.id}
                                className="bg-white border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {est.nomeFantasia}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {est.cidade &&
                                        est.estado &&
                                        `${est.cidade}, ${est.estado}`}
                                    </p>
                                  </div>
                                </div>

                                {est.cupomConfig ? (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-blue-900">
                                        Cupom: {est.cupomConfig.codigoCupom}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          est.cupomConfig.status === "ATIVO"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                      >
                                        {est.cupomConfig.status}
                                      </span>
                                    </div>
                                    <div className="text-gray-600 text-xs space-y-1">
                                      {est.cupomConfig.descricao && (
                                        <p>
                                          Descrição: {est.cupomConfig.descricao}
                                        </p>
                                      )}
                                      <p className="text-blue-700 font-medium">
                                        Importados:{" "}
                                        {
                                          est.cupomConfig._count
                                            .cuponsImportados
                                        }
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">
                                    Nenhum cupom configurado
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {consultores.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Nenhum consultor cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
