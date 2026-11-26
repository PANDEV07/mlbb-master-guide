import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function PatchBanner() {
  return (
    <div className="border-b border-[#1E2A33] bg-[#0B1014] px-4 py-2 text-xs text-slate-300 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-3.5 w-3.5 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <span>
            <strong className="font-semibold text-slate-100">
              Original Server
            </strong>{" "}
            — Seluruh panduan memisahkan data terverifikasi dan kandidat mekanik
            secara transparan.
          </span>
        </div>
        <Link
          href="/patches"
          className="font-medium text-emerald-300 transition-colors hover:text-emerald-200"
        >
          Lihat Pusat Patch →
        </Link>
      </div>
    </div>
  );
}
