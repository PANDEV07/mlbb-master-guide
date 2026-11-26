import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "MLBB Master Guide — Panduan Strategi, Build, Counter & Matchup MLBB",
  description:
    "Platform strategi Mobile Legends: Bang Bang yang ringkas, sadar-patch, dan berbasis bukti: Hero, Kombo, Item, Build, Counter, Matchup 1v1 & Draft 5v5, hingga Akademi Ranked.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link
          rel="preload"
          href="/fonts/rajdhani-700-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/inter-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://static.wikia.nocookie.net"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://akmweb.youngjoygame.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#0A0E1A] font-sans text-[#E6EAF5] antialiased selection:bg-[#F5B83D]/30 selection:text-[#F5B83D]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
