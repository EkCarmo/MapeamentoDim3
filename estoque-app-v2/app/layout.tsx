import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Controle de Estoque",
  description: "Mapeamento de armazéns, produtos e movimentações",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <AuthGate>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Nav />
            <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
