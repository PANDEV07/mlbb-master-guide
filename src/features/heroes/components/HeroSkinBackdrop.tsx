"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  formatSkinTierLabelId,
  type HeroPremiumSkinRecord,
} from "../data/hero-skin-utils";

interface HeroSkinBackdropProps {
  skin: HeroPremiumSkinRecord | null;
  heroName: string;
  /** Mode compact untuk kartu sorotan #1 Meta di beranda */
  variant?: "banner" | "card";
}

export function HeroSkinBackdrop({
  skin,
  heroName,
  variant = "banner",
}: HeroSkinBackdropProps) {
  const [failed, setFailed] = useState(false);

  if (!skin || failed) {
    return (
      <span
        aria-hidden="true"
        className="font-display pointer-events-none absolute -top-10 right-6 text-[15rem] leading-none text-white/10 select-none"
      >
        {heroName.charAt(0)}
      </span>
    );
  }

  const label = formatSkinTierLabelId(skin.skinTier, skin.skinTag);
  // Self-hosted WebP (public/skins) agar LCP cepat, tanpa bergantung CDN eksternal
  const optimizedUrl = `/skins/${skin.heroSlug}-${variant === "banner" ? 1200 : 640}.webp`;

  return (
    <>
      {/* Full-bleed HD Skin Splash Art (dioptimalkan via CDN resize WebP) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedUrl}
        alt={`Splash art skin ${skin.skinName} untuk ${heroName}`}
        referrerPolicy="no-referrer"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={() => setFailed(true)}
        className={
          variant === "banner"
            ? "pointer-events-none absolute inset-0 h-full w-full object-cover object-[72%_20%] opacity-85 transition-transform duration-700"
            : "pointer-events-none absolute inset-0 h-full w-full object-cover object-[65%_18%] opacity-70 transition-transform duration-500 group-hover:scale-105"
        }
      />

      {/* Gradient Scrim agar teks kiri tetap kontras & skin kanan terlihat tajam */}
      <div
        aria-hidden="true"
        className={
          variant === "banner"
            ? "pointer-events-none absolute inset-0 bg-[linear-gradient(95deg,rgba(10,14,26,0.96)_0%,rgba(10,14,26,0.88)_38%,rgba(16,24,48,0.48)_68%,rgba(10,14,26,0.22)_100%)]"
            : "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,26,0.62)_0%,rgba(10,14,26,0.72)_55%,rgba(10,14,26,0.95)_100%)]"
        }
      />

      {/* Vignette bawah */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,14,26,0.8)_0%,transparent_45%)]"
      />

      {/* Label Skin Premium di Pojok Kanan Bawah (Banner Detail Hero) */}
      {variant === "banner" && (
        <div className="pointer-events-none absolute right-4 bottom-3 z-10 hidden items-center gap-1.5 border border-[#F5B83D]/50 bg-[#0A0E1A]/85 px-2.5 py-1 text-[11px] backdrop-blur-sm sm:inline-flex">
          <Sparkles className="h-3 w-3 text-[#F5B83D]" aria-hidden="true" />
          <span className="font-display text-[#F5B83D]">{skin.skinName}</span>
          <span className="text-[#9AA6C4]">· {label}</span>
        </div>
      )}
    </>
  );
}
