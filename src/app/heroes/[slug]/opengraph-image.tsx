import { ImageResponse } from "next/og";
import { getMetaDashboardPayload, formatPercent } from "@/features/meta";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";

export const alt = "Statistik Meta, Tier & Panduan Hero MLBB";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const TIER_COLORS: Record<string, string> = {
  S: "#F5B83D",
  A: "#22D3EE",
  B: "#4ADE80",
  C: "#94A3B8",
  D: "#E11D48",
};

export default async function HeroOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = getMetaDashboardPayload();
  const metaHero = payload.brackets.mythical_glory.heroes.find(
    (h) => h.heroSlug === slug,
  );

  const heroName =
    metaHero?.heroName ??
    slug
      .split("-")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ""))
      .join(" ");
  const roles = metaHero?.roles ?? HERO_ROLE_MAP[slug] ?? ["Hero MLBB"];
  const lanes = metaHero?.lanes ?? HERO_LANE_MAP[slug] ?? [];
  const tier = metaHero?.tier ?? "B";
  const tierColor = TIER_COLORS[tier] ?? "#F5B83D";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 64px",
          background:
            "radial-gradient(circle at 82% 35%, rgba(34,211,238,0.28), transparent 55%), linear-gradient(145deg, #43122a 0%, #131e47 52%, #0A0E1A 100%)",
          color: "#E6EAF5",
          fontFamily: "sans-serif",
          borderTop: `6px solid ${tierColor}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "#F5B83D",
                color: "#0A0E1A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              MG
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#F5B83D",
                letterSpacing: "0.08em",
              }}
            >
              MLBB MASTER GUIDE
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.45)",
              padding: "6px 16px",
              background: "rgba(10,14,26,0.7)",
            }}
          >
            MYTHICAL GLORY+ · RESMI MOONTON
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {roles.slice(0, 2).map((r) => (
                <span
                  key={r}
                  style={{
                    background: "#22D3EE",
                    color: "#0A0E1A",
                    padding: "4px 16px",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {r.toUpperCase()}
                </span>
              ))}
              {lanes.slice(0, 1).map((l) => (
                <span
                  key={l}
                  style={{
                    background: "#F5B83D",
                    color: "#0A0E1A",
                    padding: "4px 16px",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
            <div
              style={{
                fontSize: 86,
                fontWeight: 900,
                lineHeight: 0.95,
                color: "#FFFFFF",
              }}
            >
              {heroName.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, color: "#9AA6C4" }}>
              Skill Bahasa Indonesia · Kombo · Build · Analisis Mekanik
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 170,
              height: 170,
              background: tierColor,
              color: tier === "D" ? "#FFFFFF" : "#0A0E1A",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800 }}>TIER</span>
            <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.9 }}>
              {tier}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 48,
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, color: "#9AA6C4" }}>WIN RATE</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#F5B83D" }}>
              {metaHero ? formatPercent(metaHero.winRate) : "—"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, color: "#9AA6C4" }}>PICK RATE</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#22D3EE" }}>
              {metaHero ? formatPercent(metaHero.pickRate) : "—"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, color: "#9AA6C4" }}>BAN RATE</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#FB7185" }}>
              {metaHero ? formatPercent(metaHero.banRate) : "—"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, color: "#9AA6C4" }}>SKOR META</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#4ADE80" }}>
              {metaHero ? `${metaHero.metaScore}/100` : "—"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
