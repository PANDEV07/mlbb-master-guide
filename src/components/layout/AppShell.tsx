"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { SidebarNav } from "./SidebarNav";
import { Footer } from "./Footer";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Drawer Mobile */}
      {mobileMenuOpen ? (
        <div
          id="mobile-navigation-drawer"
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-[#1E2A33] bg-[#0B1014]/98 backdrop-blur-xl lg:hidden"
        >
          <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      ) : null}

      {/* Konten Utama Lebar & Fokus */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
