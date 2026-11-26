import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";
import { getHeroDirectory } from "@/features/heroes";
import { getItemCatalog } from "@/features/items/server/item.repository";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/heroes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/items`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/builds`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/draft`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE_URL}/counters`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/matchups`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/academy`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/patches`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const [heroDir, itemCatalog] = await Promise.all([
    getHeroDirectory().catch(() => ({ heroes: [] })),
    getItemCatalog().catch(() => ({ items: [] })),
  ]);

  const heroPages: MetadataRoute.Sitemap = heroDir.heroes.flatMap((h) => [
    {
      url: `${SITE_URL}/heroes/${h.metadata.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/builds/${h.metadata.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    },
  ]);

  const itemPages: MetadataRoute.Sitemap = itemCatalog.items
    .filter((i) => Boolean(i.slug))
    .map((i) => ({
      url: `${SITE_URL}/items/${i.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...heroPages, ...itemPages];
}
