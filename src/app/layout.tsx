import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import { leerTema } from "@/lib/tema";
import "./globals.css";

// Atkinson Hyperlegible distingue l, 1, I, 0 y O: ayuda a leer y dictar contraseñas e internos.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
});

const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mesa de ayuda",
  description: "Gestión interna de la mesa de ayuda",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-theme={await leerTema()} className={`${atkinson.variable} ${atkinsonMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
