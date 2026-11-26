import { ImageResponse } from "next/og";

export const alt =
  "MLBB Master Guide — Dashboard Meta, Tier List S–D, Counter & Draft 5v5";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "radial-gradient(circle at 80% 30%, rgba(34,211,238,0.28), transparent 55%), linear-gradient(135deg, #0A0E1A 0%, #101830 55%, #162147 100%)",
          color: "#E6EAF5",
          fontFamily: "sans-serif",
          borderTop: "6px solid #F5B83D",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#F5B83D",
              color: "#0A0E1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            MG
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "#F5B83D",
                letterSpacing: "0.08em",
              }}
            >
              MLBB MASTER GUIDE
            </span>
            <span style={{ fontSize: 16, color: "#22D3EE" }}>
              ORIGINAL SERVER · DATA RESMI MOONTON GMS
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "0.02em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>DOMINASI</span>
            <span style={{ color: "#F5B83D" }}>LAND OF DAWN</span>
          </div>
          <p
            style={{
              fontSize: 24,
              color: "#9AA6C4",
              maxWidth: 880,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Tier List S–D per Role, Skill Bahasa Indonesia Resmi, Counter 1–5
            Hero Musuh, Draft 5v5, dan Template Build untuk 133 Hero MLBB.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            borderTop: "1px solid rgba(34,211,238,0.3)",
            paddingTop: 24,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          <span style={{ color: "#F5B83D" }}>133 HERO</span>
          <span style={{ color: "#22D3EE" }}>104 ITEM</span>
          <span style={{ color: "#4ADE80" }}>393 BUILD TEMPLATE</span>
          <span style={{ color: "#E6EAF5" }}>262 KOMBO SKILL</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
