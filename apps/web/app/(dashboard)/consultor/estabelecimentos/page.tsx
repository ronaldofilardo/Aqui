"use client";

import { useEstabelecimentos } from "./_hooks/useEstabelecimentos";
import EstabelecimentoForm from "./_components/EstabelecimentoForm";
import EstabelecimentoCard from "./_components/EstabelecimentoCard";
import ConviteModal from "./_components/ConviteModal";

export default function EstabelecimentosPage() {
  const {
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
  } = useEstabelecimentos();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meus Estabelecimentos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Estabelecimento"}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            msg.includes("sucesso") ||
            msg.includes("cadastrado") ||
            msg.includes("enviado") ||
            msg.includes("atribuído")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg}
        </div>
      )}

      {showForm && (
        <EstabelecimentoForm
          form={form}
          onChange={setForm}
          fieldErrors={fieldErrors}
          onClearError={clearFieldError}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {estabs.map((e) => (
            <div key={e.id}>
              <EstabelecimentoCard
                e={e}
                uploadingId={uploadingId}
                gerandoConvite={gerandoConvite}
                onGerarConvite={gerarConvite}
                onDownloadQR={downloadQR}
                onUpload={handleUpload}
                setMsg={setMsg}
              />
            </div>
          ))}
          {estabs.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Nenhum estabelecimento cadastrado
            </div>
          )}
        </div>
      )}

      {conviteModal && (
        <ConviteModal
          nomeFantasia={conviteModal.nomeFantasia}
          link={conviteModal.link}
          copiado={copiadoConvite}
          onCopy={copiarLink}
          onClose={() => setConviteModal(null)}
        />
      )}
    </div>
  );
}
