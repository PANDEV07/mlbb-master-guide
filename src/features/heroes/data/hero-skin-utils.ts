export interface HeroPremiumSkinRecord {
  heroSlug: string;
  heroName: string;
  skinName: string;
  skinTier: string;
  skinTag: string;
  splashUrl: string;
  width: number;
  height: number;
  sourceUrl: string;
}

export function formatSkinTierLabelId(tier: string, tag: string): string {
  const cleanTag = tag.trim();
  const cleanTier = tier.trim();
  if (cleanTag && cleanTag.toLowerCase() !== cleanTier.toLowerCase()) {
    return `${cleanTag} · ${cleanTier}`;
  }
  return cleanTier || "Default";
}

/**
 * Menggunakan parameter resize bawaan CDN static.wikia.nocookie.net
 * agar splash art 2K/4K (3-5MB) dikirim sebagai WebP ringan (~50-130KB).
 */
export function getOptimizedSplashUrl(
  splashUrl: string,
  maxWidth: number,
): string {
  if (
    splashUrl.includes("static.wikia.nocookie.net/") &&
    splashUrl.includes("/revision/latest") &&
    !splashUrl.includes("/scale-to-width-down/")
  ) {
    return splashUrl.replace(
      "/revision/latest",
      `/revision/latest/scale-to-width-down/${maxWidth}`,
    );
  }
  return splashUrl;
}
