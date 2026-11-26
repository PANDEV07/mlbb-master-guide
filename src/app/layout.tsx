import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "MLBB Master Guide — Tier List S–D Resmi Moonton, Counter, Build & Matchup",
    template: `%s`,
  },
  description:
    "Platform strategi Mobile Legends: Bang Bang yang ringkas, sadar-patch, dan berbasis data resmi Moonton: Tier List S–D, Hero & Skill Bahasa Indonesia, Kombo, Item, Build, Counter 1–5 Musuh, dan Matchup 5v5.",
  keywords: [
    "Mobile Legends",
    "MLBB",
    "Tier List MLBB",
    "Counter Hero MLBB",
    "Build MLBB",
    "Matchup MLBB",
    "Meta MLBB Terbaru",
    "Panduan Ranked MLBB",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: "MLBB Master Guide — Dashboard Meta, Tier List S–D & Strategi MLBB",
    description:
      "Statistik Win Rate, Pick Rate, Ban Rate resmi Moonton GMS, Counter 1–5 musuh, Draft 5v5, dan skill Bahasa Indonesia lengkap untuk 133 hero.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MLBB Master Guide — Tier List S–D, Counter & Draft 5v5",
    description:
      "Panduan Mobile Legends: Bang Bang berbasis data resmi Moonton GMS, sadar-patch, dan transparan sumber.",
  },
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
