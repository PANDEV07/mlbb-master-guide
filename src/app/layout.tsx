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
      <body className="min-h-screen bg-[#090D10] font-sans text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
