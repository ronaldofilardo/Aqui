import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="bg-primary-600 px-8 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-primary-600 font-black text-sm">AS</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Acesso Saúde <span className="font-normal opacity-80">Aqui</span>
          </span>
        </div>
        <Link
          href="/login"
          className="bg-white text-primary-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-primary-50 transition shadow-sm"
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 relative bg-gray-900 overflow-hidden">
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent z-10" />

        {/* Background decorative */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 to-gray-900 z-0" />

        <div className="relative z-20 flex flex-col justify-center min-h-[520px] px-12 py-20 max-w-2xl">
          <h1 className="text-white text-5xl font-black leading-tight mb-6 drop-shadow-lg">
            Satisfação em acolher
            <br />
            <span className="text-primary-400">e cuidar</span> de você.
          </h1>
          <div className="border-l-4 border-primary-500 pl-4 mb-8">
            <p className="text-gray-200 text-lg leading-relaxed">
              Plataforma de gestão de cupons, consultas e comissões.
              <br />
              Bem-vindo à rede Acesso Saúde Aqui.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-primary-500/30 w-fit"
          >
            Acessar Plataforma
            <span className="text-lg">→</span>
          </Link>
        </div>
      </main>

      {/* Quick Actions — cards laranjas estilo site de referência */}
      <section className="bg-white px-8 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📋", label: "Gestão de Cupons" },
            { icon: "💰", label: "Comissões" },
            { icon: "📊", label: "Dashboard" },
            { icon: "👥", label: "Consultores" },
          ].map((item) => (
            <Link
              key={item.label}
              href="/login"
              className="flex flex-col items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl p-6 transition-all shadow-md hover:shadow-lg group"
            >
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <span className="font-bold text-sm text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-600 px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-black text-xs">AS</span>
            </div>
            <span className="text-white font-semibold text-sm">
              Acesso Saúde Aqui
            </span>
          </div>
          <p className="text-primary-200 text-xs text-center">
            Plataforma de gestão interna · Acesso Saúde ©{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
