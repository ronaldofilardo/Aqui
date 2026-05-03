import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { validateSecrets } from "@/lib/validate-secrets";

// Validate security configuration at startup
validateSecrets();

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="pt-BR" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
