"use client";

interface Props {
  nomeFantasia: string;
  link: string;
  copiado: boolean;
  onCopy: (link: string) => void;
  onClose: () => void;
}

export default function ConviteModal({ nomeFantasia, link, copiado, onCopy, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Link de acesso</h2>
            <p className="text-sm text-gray-500 mt-0.5">{nomeFantasia}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Envie o link abaixo para o estabelecimento via WhatsApp, e-mail ou qualquer outro canal. O link expira em <strong>7 dias</strong>.
        </p>

        <div className="flex gap-2">
          <input
            id="convite-link-input"
            type="text"
            readOnly
            value={link}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 bg-gray-50 focus:outline-none select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => onCopy(link)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              copiado
                ? "bg-green-600 text-white"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            {copiado ? "✓ Copiado!" : "Copiar"}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          O estabelecimento precisará informar nome, e-mail e criar uma senha ao acessar o link.
        </p>
      </div>
    </div>
  );
}
