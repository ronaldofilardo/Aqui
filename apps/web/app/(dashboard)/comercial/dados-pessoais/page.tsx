"use client";

import { useSession } from "next-auth/react";

export default function ComercialDadosPessoais() {
  const { data: session } = useSession();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Dados Pessoais
      </h1>
      <div className="card max-w-xl">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Nome</p>
            <p className="font-medium text-gray-900">{session?.user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Perfil</p>
            <p className="font-medium text-gray-900">Comercial</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Para editar dados sensíveis (telefone, senha) entre em contato com o
          seu Gestor PF.
        </p>
      </div>
    </div>
  );
}
