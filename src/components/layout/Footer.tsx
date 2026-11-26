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
    <footer className="mt-12 border-t border-[#F5B83D]/35 bg-[#070A14] px-4 py-9 pb-24 text-xs text-[#9AA6C4] sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="mlbb-btn-chamfer font-display inline-flex h-6 w-6 items-center justify-center bg-[#F5B83D] text-[11px] font-extrabold text-[#0A0E1A]">
              MG
            </span>
            <span className="font-display text-xl text-[#F5B83D]">
              MLBB MASTER GUIDE
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#9AA6C4]">
            Situs ini adalah panduan strategi Mobile Legends: Bang Bang buatan
            penggemar yang sadar-patch dan transparan sumber. Mobile Legends:
            Bang Bang dan seluruh materi terkait adalah milik Moonton.
          </p>
        </div>

        <nav
          aria-label="Navigasi Footer"
          className="font-display flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#22D3EE]"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#F5B83D]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
