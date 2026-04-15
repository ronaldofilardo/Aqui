import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">Acesso Saúde Aqui</h1>
        <p className="text-xl mb-8 opacity-90">
          Gestão de Cupons, Consultas e Comissões
        </p>
        <Link
          href="/login"
          className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
