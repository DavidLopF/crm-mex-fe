import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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
  title: "CRM  - Sistema de Gestión",
  description: "Sistema de gestión de inventarios, ventas y clientes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="ml-64 transition-all duration-300">
            <Header />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
