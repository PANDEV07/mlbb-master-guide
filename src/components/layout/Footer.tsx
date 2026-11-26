import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/heroes", label: "Hero" },
  { href: "/items", label: "Item" },
  { href: "/builds", label: "Build" },
  { href: "/matchups", label: "Matchup & Draft" },
  { href: "/counters", label: "Counter" },
  { href: "/academy", label: "Akademi" },
  { href: "/patches", label: "Patch" },
] as const;

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[#1E2A33] bg-[#0B1014]/80 px-4 py-8 text-xs text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-[10px] font-extrabold text-slate-950">
              MG
            </span>
            <span className="font-semibold text-slate-100">
              MLBB Master Guide
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Panduan strategi Mobile Legends: Bang Bang — sadar-patch, transparan
            sumber, tanpa klaim win rate palsu.
          </p>
        </div>

        <nav
          aria-label="Navigasi Footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-400 transition-colors hover:text-emerald-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
