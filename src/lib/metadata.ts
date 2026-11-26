import type { Metadata } from "next";

export const SITE_NAME = "MLBB Master Guide";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mlbb-master-guide.vercel.app";

export function buildPageMetadata(
  title: string,
  description: string,
  options?: {
    canonicalPath?: string;
    keywords?: string[];
  },
): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title: fullTitle,
    description,
    keywords: options?.keywords,
    alternates: options?.canonicalPath
      ? { canonical: options.canonicalPath }
      : undefined,
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: options?.canonicalPath ?? "/",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
