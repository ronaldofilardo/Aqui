"use client";

import { useState } from "react";
import { toast } from "sonner";

interface NovoComercialFormProps {
  onCreated: () => void;
}

export function NovoComercialForm({ onCreated }: NovoComercialFormProps) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [funcao, setFuncao] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/gestor-pf/comerciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cpf,
          email: email.toLowerCase().trim(),
          telefone: telefone || undefined,
          funcao: funcao || undefined,
          percentualComissao: 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar comercial");
        return;
      }

      toast.success("Comercial criado com sucesso");
      setNome("");
      setCpf("");
      setEmail("");
      setTelefone("");
      setFuncao("");
      onCreated();
    } catch {
      toast.error("Erro ao criar comercial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Novo Comercial
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
            pattern="\d{11}"
            title="CPF deve ter 11 dígitos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Função
          </label>
          <select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="SUPERVISOR_COMERCIAL">Supervisor Comercial</option>
            <option value="GERENTE_CIRE">Gerente CIRE</option>
            <option value="SUPERVISOR_ATIVO">Supervisor Ativo</option>
            <option value="SUPERVISOR_RECEPTIVO">Supervisor Receptivo</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "Criando..." : "Criar Comercial"}
      </button>
    </form>
  );
}