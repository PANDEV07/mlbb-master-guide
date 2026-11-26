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
      className="relative w-full max-w-xl"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#22D3EE]"
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
          className="w-full border border-[#22D3EE]/35 bg-[#101830]/95 py-3 pr-11 pl-11 text-sm text-[#E6EAF5] placeholder:text-[#9AA6C4]/70 shadow-lg shadow-black/30 outline-none transition focus:border-[#F5B83D] focus:ring-2 focus:ring-[#F5B83D]/25"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="absolute top-1/2 right-3.5 -translate-y-1/2 p-1 text-[#9AA6C4] transition hover:text-[#F5B83D]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 left-0 z-40 mt-2 overflow-hidden border border-[#22D3EE]/40 bg-[#101830] shadow-2xl shadow-black/70">
          {totalMatches === 0 ? (
            <div className="p-5 text-center text-xs text-[#9AA6C4]">
              Tidak ditemukan hero atau item untuk &ldquo;{query}&rdquo;.{" "}
              <Link
                href="/search"
                className="font-semibold text-[#F5B83D] hover:underline"
              >
                Buka Pencarian Lengkap →
              </Link>
            </div>
          ) : (
            <div className="max-h-96 divide-y divide-[#22D3EE]/15 overflow-y-auto">
              {matchedHeroes.length > 0 && (
                <div className="p-3">
                  <p className="font-display mb-2 px-2 text-xs text-[#F5B83D]">
                    Hero ({matchedHeroes.length})
                  </p>
                  <div className="space-y-1">
                    {matchedHeroes.map((hero) => (
                      <div
                        key={hero.slug}
                        className="flex items-center justify-between gap-2 px-2 py-2 transition hover:bg-[#15203E]"
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
                            <p className="font-display truncate text-sm text-[#E6EAF5]">
                              {hero.name}
                            </p>
                            <p className="truncate text-[11px] text-[#9AA6C4]">
                              {[...hero.roles, ...hero.lanes].join(" · ") ||
                                "Hero MLBB"}
                            </p>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Link
                            href={`/builds/${hero.slug}`}
                            onClick={() => setFocused(false)}
                            className="font-display border border-[#22D3EE]/35 bg-[#0A0E1A] px-2.5 py-1 text-xs text-[#22D3EE] transition hover:border-[#F5B83D] hover:text-[#F5B83D]"
                          >
                            Build
                          </Link>
                          <Link
                            href={`/heroes/${hero.slug}`}
                            onClick={() => setFocused(false)}
                            className="font-display bg-[#F5B83D] px-2.5 py-1 text-xs text-[#0A0E1A] transition hover:bg-[#FFC757]"
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
                  <p className="font-display mb-2 px-2 text-xs text-[#22D3EE]">
                    Item ({matchedItems.length})
                  </p>
                  <div className="space-y-1">
                    {matchedItems.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/items/${item.slug}`}
                        onClick={() => setFocused(false)}
                        className="flex items-center justify-between gap-3 px-2 py-2 transition hover:bg-[#15203E]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {item.iconUrl ? (
                            <Image
                              src={item.iconUrl}
                              alt={item.name}
                              width={36}
                              height={36}
                              unoptimized
                              className="h-9 w-9 shrink-0 border border-[#22D3EE]/30 object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#0D1328] text-[#9AA6C4]">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-display truncate text-sm text-[#E6EAF5]">
                              {item.name}
                            </p>
                            <p className="truncate text-[11px] text-[#9AA6C4]">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
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
