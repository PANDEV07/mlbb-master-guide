import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function PatchBanner() {
  return (
    <div className="border-b border-[#22D3EE]/25 bg-[#0D1328] px-4 py-2 text-xs text-[#9AA6C4] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-3.5 w-3.5 shrink-0 text-[#F5B83D]"
            aria-hidden="true"
          />
          <span>
            <strong className="font-semibold text-[#E6EAF5]">
              Original Server
            </strong>{" "}
            — Seluruh panduan memisahkan data terverifikasi dan kandidat mekanik
            secara transparan.
          </span>
        </div>
        <Link
          href="/patches"
          className="font-display text-xs text-[#22D3EE] transition-colors hover:text-[#F5B83D]"
        >
          Lihat Pusat Patch →
        </Link>
      </div>
    </div>
  );
}
