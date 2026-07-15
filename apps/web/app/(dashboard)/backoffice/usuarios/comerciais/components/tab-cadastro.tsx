"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Comercial, Meta } from "../types";
import { formatCpf } from "../utils";
import { NovoComercialForm } from "./novo-comercial-form";
import { ComercialModal } from "./comercial-modal";

interface TabCadastroProps {
  comerciais: Comercial[];
  loadingMetasGerais: boolean;
  metasGerais: Record<string, Meta[]>;
  anoReferencia: number;
  onEditarComercial: (id: string) => void;
  onDeletarComercial: (id: string) => void;
  onSalvarMetaGeral: (comercialId: string, mes: string, valor: string) => void;
  onRefetch: () => void;
}

const mesesAno = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

export function TabCadastro({
  comerciais,
  loadingMetasGerais,
  metasGerais,
  anoReferencia,
  onEditarComercial,
  onDeletarComercial,
  onSalvarMetaGeral,
}: TabCadastroProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <div className="flex-shrink-0">
        <NovoComercialForm onCreated={() => {}} />
      </div>

      <div className="card mt-6 flex-grow overflow-hidden" style={{ width: 'calc(100vw - 280px)' }}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Comerciais Cadastrados - Metas Anual ({anoReferencia})
        </h2>
        {loadingMetasGerais ? (
          <p className="text-sm text-gray-500">Carregando metas...</p>
        ) : comerciais.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum comercial cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-auto flex-grow" style={{ maxWidth: '100%' }}>
            <table className="w-full text-sm" style={{ minWidth: '1400px' }}>
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">Comercial</th>
                  <th className="text-left p-3 font-semibold text-gray-700 sticky left-64 bg-gray-50 z-10">Função</th>
                  <th className="text-center p-3 font-semibold text-gray-700 sticky left-[340px] bg-gray-50 z-10">Ações</th>
                  {mesesAno.map((m) => (
                    <th key={m.value} className="text-center p-2 font-semibold text-gray-700 min-w-[90px]">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comerciais.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <button
                        onClick={() => onEditarComercial(c.id)}
                        className="text-left hover:text-primary-600 hover:underline"
                      >
                        <p className="font-medium text-gray-900">{c.nome}</p>
                        <p className="text-xs text-gray-500">{formatCpf(c.cpf)}</p>
                      </button>
                    </td>
                    <td className="p-3 sticky left-64 bg-white z-10">
                      <p className="text-xs text-gray-600">{c.funcao ? c.funcao.replace(/_/g, " ") : "-"}</p>
                      <p className="text-xs text-gray-500">{c.status}</p>
                    </td>
                    <td className="p-2 text-center sticky left-[340px] bg-white z-10">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onEditarComercial(c.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => onDeletarComercial(c.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                          title="Deletar"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </td>
                    {mesesAno.map((m) => {
                      const mesRef = `${anoReferencia}-${m.value}`;
                      const meta = metasGerais[c.id]?.find(
                        (mt) => mt.mesReferencia === mesRef
                      );
                      return (
                        <td key={m.value} className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={meta ? Number(meta.valorMeta) : ""}
                            placeholder="R$"
                            className="w-full px-2 py-1 border rounded text-xs text-center focus-ring"
                            onBlur={(e) => {
                              const valor = e.target.value;
                              if (valor) {
                                onSalvarMetaGeral(c.id, mesRef, valor);
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
