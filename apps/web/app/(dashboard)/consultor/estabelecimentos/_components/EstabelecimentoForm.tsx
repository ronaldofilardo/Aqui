"use client";

import { EstabelecimentoFormData, formatCNPJ } from "../lib/utils";

interface Props {
  form: EstabelecimentoFormData;
  onChange: (f: EstabelecimentoFormData) => void;
  fieldErrors: Record<string, string>;
  onClearError: (field: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EstabelecimentoForm({
  form,
  onChange,
  fieldErrors,
  onClearError,
  submitting,
  onSubmit,
}: Props) {
  const update = (field: keyof EstabelecimentoFormData, value: string) => {
    onChange({ ...form, [field]: value });
    onClearError(field);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Input label="Nome Fantasia *" field="nomeFantasia" form={form} onChange={onChange} error={fieldErrors.nomeFantasia} />
      <Input label="Razão Social" field="razaoSocial" form={form} onChange={onChange} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
        <input
          type="text"
          value={form.cnpj}
          onChange={(e) => update("cnpj", formatCNPJ(e.target.value))}
          placeholder="00.000.000/0000-00"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${fieldErrors.cnpj ? "border-red-500" : ""}`}
        />
        {fieldErrors.cnpj && <p className="text-red-500 text-xs mt-1">{fieldErrors.cnpj}</p>}
      </div>
      <Input label="Endereço" field="endereco" form={form} onChange={onChange} />
      <Input label="Cidade" field="cidade" form={form} onChange={onChange} />
      <Input label="Estado" field="estado" form={form} onChange={onChange} maxLength={2} upperCase />
      <Input label="Telefone" field="telefone" form={form} onChange={onChange} />
      <Input label="Email" field="email" type="email" form={form} onChange={onChange} />
      <Input label="Responsável" field="responsavelNome" form={form} onChange={onChange} />
      <Input label="CPF Responsável" field="responsavelCpf" form={form} onChange={onChange} />

      <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Dados Bancários (Opcional)</h4>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de PIX</label>
        <select
          value={form.pixTipo}
          onChange={(e) => {
            onChange({ ...form, pixTipo: e.target.value });
            onClearError("pixChave");
          }}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">Selecione...</option>
          <option value="CPF">CPF</option>
          <option value="CNPJ">CNPJ</option>
          <option value="EMAIL">Email</option>
          <option value="TELEFONE">Telefone</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
        <input
          type="text"
          value={form.pixChave}
          onChange={(e) => update("pixChave", e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${fieldErrors.pixChave ? "border-red-500" : ""}`}
        />
        {fieldErrors.pixChave && <p className="text-red-500 text-xs mt-1">{fieldErrors.pixChave}</p>}
      </div>

      <Input label="Banco" field="bancoNome" form={form} onChange={onChange} />
      <Input label="Agência" field="agencia" form={form} onChange={onChange} />
      <Input label="Conta" field="conta" form={form} onChange={onChange} />

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  field,
  type = "text",
  form,
  onChange,
  error,
  maxLength,
  upperCase,
}: {
  label: string;
  field: keyof EstabelecimentoFormData;
  type?: string;
  form: EstabelecimentoFormData;
  onChange: (f: EstabelecimentoFormData) => void;
  error?: string;
  maxLength?: number;
  upperCase?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        maxLength={maxLength}
        value={form[field]}
        onChange={(e) => onChange({ ...form, [field]: upperCase ? e.target.value.toUpperCase() : e.target.value })}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${error ? "border-red-500" : ""}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
