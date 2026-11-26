"use client";

import { useState } from "react";
import { HERO_IMAGE_FILES } from "../data/hero-image-map";

interface HeroPortraitProps {
  slug: string;
  name: string;
  className: string;
}

function normalizeHeroSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function HeroPortrait({ slug, name, className }: HeroPortraitProps) {
  const [failed, setFailed] = useState(false);

  const normalizedSlug = normalizeHeroSlug(slug);

  const fileName =
    HERO_IMAGE_FILES[slug] ??
    HERO_IMAGE_FILES[normalizedSlug];

  const src = fileName ? `/heroes/${fileName}` : null;

  if (!src || failed) {
    return (
      <div
        aria-label={`Portrait ${name} tidak tersedia`}
        className={`flex shrink-0 items-center justify-center rounded-xl border border-[#263247] bg-gradient-to-br from-slate-700 to-slate-950 font-bold text-slate-200 ${className}`}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Portrait ${name}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-xl border border-[#263247] object-cover ${className}`}
    />
  );
}