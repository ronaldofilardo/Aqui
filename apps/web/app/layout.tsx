import type { Metadata } from "next";
import "./globals.css";
import { validateSecrets } from "@/lib/validate-secrets";

validateSecrets();

export const metadata: Metadata = {
  title: "Acesso Saúde Aqui",
  description:
    "Programa Acesso Saúde Aqui - Gestão de Cupons, Consultas e Comissões",
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
