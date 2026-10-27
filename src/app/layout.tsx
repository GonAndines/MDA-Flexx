import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { leerTema } from "@/lib/tema";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mesa de ayuda",
  description: "Gestión interna de la mesa de ayuda",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-theme={await leerTema()} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
