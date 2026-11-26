import rawMetaStats from "@/data/imports/hero-meta-stats.json";
import { buildMetaDashboardPayload } from "../engine/tier-list-engine";
import type { MetaDashboardPayload } from "../types/meta.types";

let cachedPayload: MetaDashboardPayload | null = null;

export function getMetaDashboardPayload(): MetaDashboardPayload {
  if (cachedPayload) return cachedPayload;

  cachedPayload = buildMetaDashboardPayload(
    rawMetaStats as Parameters<typeof buildMetaDashboardPayload>[0],
  );
  return cachedPayload;
}
