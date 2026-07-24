import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Pagina nao encontrada</h1>
        <Link href="/login" className="text-primary-600 hover:underline">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
