import type { Metadata } from "next";

const SITE_NAME = "MLBB Master Guide";

export function buildPageMetadata(title: string, description: string): Metadata {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
  };
}
