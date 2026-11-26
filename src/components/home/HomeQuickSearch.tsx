"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Search, X } from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";

export interface QuickSearchHero {
  slug: string;
  name: string;
  roles: string[];
  lanes: string[];
}

export interface QuickSearchItem {
  slug: string;
  name: string;
  category: string;
  iconUrl: string | null;
}

type Props = {
  heroes: QuickSearchHero[];
  items: QuickSearchItem[];
};

export function HomeQuickSearch({ heroes, items }: Props) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().toLowerCase();

  const matchedHeroes = useMemo(() => {
    if (!trimmed) return [];
    return heroes
      .filter(
        (h) =>
          h.name.toLowerCase().includes(trimmed) ||
          h.roles.some((r) => r.toLowerCase().includes(trimmed)) ||
          h.lanes.some((l) => l.toLowerCase().includes(trimmed)),
      )
      .slice(0, 6);
  }, [heroes, trimmed]);

  const matchedItems = useMemo(() => {
    if (!trimmed) return [];
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(trimmed) ||
          i.category.toLowerCase().includes(trimmed),
      )
      .slice(0, 4);
  }, [items, trimmed]);

  const showDropdown = focused && trimmed.length > 0;
  const totalMatches = matchedHeroes.length + matchedItems.length;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-emerald-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setFocused(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFocused(false);
            }
          }}
          placeholder="Cari hero, role, lane, atau item (mis. Aamon, Fanny, Athena)..."
          aria-label="Pencarian cepat hero dan item"
          className="w-full rounded-2xl border border-[#243440] bg-[#0B1014]/95 py-3.5 pr-11 pl-11 text-sm text-white placeholder:text-slate-500 shadow-lg shadow-black/25 outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 left-0 z-30 mt-2 overflow-hidden rounded-2xl border border-[#243440] bg-[#10161B] shadow-2xl shadow-black/60">
          {totalMatches === 0 ? (
            <div className="p-5 text-center text-xs text-slate-400">
              Tidak ditemukan hero atau item untuk &ldquo;{query}&rdquo;.{" "}
              <Link
                href="/search"
                className="font-semibold text-emerald-300 hover:underline"
              >
                Buka Pencarian Lengkap →
              </Link>
            </div>
          ) : (
            <div className="max-h-96 divide-y divide-[#1E2A33] overflow-y-auto">
              {matchedHeroes.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Hero ({matchedHeroes.length})
                  </p>
                  <div className="space-y-1">
                    {matchedHeroes.map((hero) => (
                      <div
                        key={hero.slug}
                        className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition hover:bg-white/5"
                      >
                        <Link
                          href={`/heroes/${hero.slug}`}
                          onClick={() => setFocused(false)}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <HeroPortrait
                            slug={hero.slug}
                            name={hero.name}
                            className="h-10 w-9 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white">
                              {hero.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {[...hero.roles, ...hero.lanes].join(" · ") ||
                                "Hero MLBB"}
                            </p>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Link
                            href={`/builds/${hero.slug}`}
                            onClick={() => setFocused(false)}
                            className="rounded-lg border border-[#263542] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-emerald-400/50 hover:text-emerald-200"
                          >
                            Build
                          </Link>
                          <Link
                            href={`/heroes/${hero.slug}`}
                            onClick={() => setFocused(false)}
                            className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                          >
                            Detail
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedItems.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                    Item ({matchedItems.length})
                  </p>
                  <div className="space-y-1">
                    {matchedItems.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/items/${item.slug}`}
                        onClick={() => setFocused(false)}
                        className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {item.iconUrl ? (
                            <Image
                              src={item.iconUrl}
                              alt={item.name}
                              width={36}
                              height={36}
                              unoptimized
                              className="h-9 w-9 shrink-0 rounded-lg border border-[#263542] object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#151D24] text-slate-400">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white">
                              {item.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
