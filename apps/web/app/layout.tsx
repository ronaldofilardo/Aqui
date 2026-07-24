import type { Metadata } from "next";
import "./globals.css";
import { validateSecrets } from "@/lib/validate-secrets";

validateSecrets();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acesso Saude Aqui",
  description:
    "Programa Acesso Saude Aqui - Gestao de Cupons, Consultas e Comissoes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
