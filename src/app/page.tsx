import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  GitCompare,
  GraduationCap,
  History,
  Layers,
  Layers3,
  Package,
  Shield,
  Swords,
} from "lucide-react";
import { buildPageMetadata } from "@/lib/metadata";
import { getHeroDirectory } from "@/features/heroes";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { getHeroPremiumSkin } from "@/features/heroes/data/hero-premium-skins";
import { HeroSkinBackdrop } from "@/features/heroes/components/HeroSkinBackdrop";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { getItemCatalog } from "@/features/items/server/item.repository";
import { formatPercent, getMetaDashboardPayload } from "@/features/meta";
import { MetaTierListBoard } from "@/features/meta/components/MetaTierListBoard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import {
  HomeQuickSearch,
  type QuickSearchHero,
  type QuickSearchItem,
} from "@/components/home/HomeQuickSearch";

export const metadata = buildPageMetadata(
  "Dashboard Meta & Panduan Strategi",
  "Dashboard meta Mobile Legends: Bang Bang dengan Tier List S–D per Role dari data resmi Moonton, pencarian cepat Hero & Item, Matchup 1v1 & 5v5, Counter, Build, dan Akademi Ranked.",
);

export const dynamic = "force-dynamic";

const CORE_TOOLS = [
  {
    href: "/matchups",
    title: "Matchup 1v1 & Draft 5v5",
    badge: "Unggulan",
    description:
      "Bandingkan duel hero satu lawan satu atau susun komposisi tim 5v5 untuk mengaudit peran, ancaman lawan, dan saran pick.",
    icon: Swords,
    accent: "text-[#F5B83D] bg-[#F5B83D]/15 border-[#F5B83D]/40",
  },
  {
    href: "/counters",
    title: "Counter Hero & Item (1–5 Musuh)",
    badge: "Praktis",
    description:
      "Pilih 1 hingga 5 hero lawan untuk menemukan hero dan item penangkal terbaik terhadap Hard CC, mobilitas, damage, dan sustain.",
    icon: GitCompare,
    accent: "text-[#22D3EE] bg-[#22D3EE]/15 border-[#22D3EE]/40",
  },
  {
    href: "/builds",
    title: "Panduan & Rakitan Build",
    badge: "393 Template",
    description:
      "Pilih 3 template build siap pakai untuk tiap hero atau susun konfigurasi item custom sesuai situasi pertandingan.",
    icon: Layers,
    accent: "text-[#4ADE80] bg-[#4ADE80]/15 border-[#4ADE80]/40",
  },
  {
    href: "/heroes",
    title: "Database Hero & Kombo",
    badge: "133 Hero",
    description:
      "Pelajari skill interaktif berbahasa Indonesia, cooldown, mekanik, dan urutan kombo untuk seluruh hero Original Server.",
    icon: Shield,
    accent: "text-[#FB7185] bg-[#E11D48]/15 border-[#E11D48]/45",
  },
] as const;

const SECONDARY_MODULES = [
  {
    href: "/items",
    title: "Database Item",
    description: "Atribut, harga, efek pasif & aktif seluruh peralatan tempur.",
    icon: Package,
    badge: "104 Item",
  },
  {
    href: "/academy",
    title: "Akademi Ranked",
    description: "Strategi realistis Solo, Duo, Trio & 5-Man dari studi pro.",
    icon: GraduationCap,
    badge: "Panduan",
  },
  {
    href: "/patches",
    title: "Pusat Patch & Meta",
    description: "Status patch aktif Original Server dan kesegaran data.",
    icon: History,
    badge: "Sadar Patch",
  },
] as const;

export default async function HomePage() {
  const [heroDirectory, itemCatalog] = await Promise.all([
    getHeroDirectory().catch(() => ({
      heroes: [],
      patch: null,
      invalidRecords: 0,
    })),
    getItemCatalog().catch(() => ({
      items: [],
      patchVersion: "",
    })),
  ]);

  const metaPayload = getMetaDashboardPayload();
  const topLeader = metaPayload.brackets.mythical_glory.spotlights.metaLeaders[0];
  const topLeaderSkin = topLeader
    ? getHeroPremiumSkin(topLeader.heroSlug)
    : null;

  const quickHeroes: QuickSearchHero[] = heroDirectory.heroes.map((h) => ({
    slug: h.metadata.slug,
    name: h.metadata.name,
    roles: HERO_ROLE_MAP[h.metadata.slug] ?? [],
    lanes: HERO_LANE_MAP[h.metadata.slug] ?? [],
  }));

  const quickItems: QuickSearchItem[] = itemCatalog.items.map((item) => ({
    slug: item.slug,
    name: item.name,
    category: item.category,
    iconUrl: item.iconUrl,
  }));

  const patchLabel =
    heroDirectory.patch?.versionCode || itemCatalog.patchVersion || "2.2.23";

  return (
    <div className="space-y-12">
      {/* Hero Banner — Cyber-Gold Navy Slanted Design */}
      <section className="relative border border-[#22D3EE]/25 bg-[radial-gradient(circle_at_75%_38%,rgba(34,211,238,0.22),transparent_55%),linear-gradient(120deg,#0A0E1A,#14193A)] px-6 pt-8 pb-10 sm:px-8 sm:pt-10 sm:pb-12 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.25fr_0.9fr]">
          {/* Kolom Kiri: Headline + Pencarian + CTA */}
          <div className="space-y-5">
            <div className="font-display flex flex-wrap items-center gap-2 text-sm text-[#22D3EE] sm:text-base">
              <span>Meta Pekan Ini</span>
              <span className="text-[#F5B83D]">•</span>
              <span>Original Server Patch {patchLabel}</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-5xl leading-[0.95] text-[#E6EAF5] sm:text-6xl lg:text-7xl">
                Dominasi
                <br />
                <span className="mlbb-glow-gold text-[#F5B83D]">
                  Land of Dawn
                </span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[#9AA6C4] sm:text-base">
                Pantau hero paling kuat di meta terbaru dari data resmi Moonton
                GMS, cek Tier List S–D per Role, racik build terbaik, dan
                menangkan draft 5v5 bersama timmu.
              </p>
            </div>

            {/* Pencarian Cepat */}
            <HomeQuickSearch heroes={quickHeroes} items={quickItems} />

            {/* CTA Buttons (Gold + Cyan Framed) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button href="#tier-list" variant="primary">
                Lihat Tier List S–D
              </Button>
              <Button href="/counters" variant="secondary">
                Analisis Counter Pick
              </Button>
            </div>

            {/* Ringkasan Katalog Nyata */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#22D3EE]/15 pt-4 text-xs text-[#9AA6C4]">
              <span>
                <strong className="font-display text-base text-[#F5B83D]">
                  {heroDirectory.heroes.length || 133}
                </strong>{" "}
                Hero
              </span>
              <span>
                <strong className="font-display text-base text-[#22D3EE]">
                  {itemCatalog.items.length || 104}
                </strong>{" "}
                Item
              </span>
              <span>
                <strong className="font-display text-base text-[#E6EAF5]">
                  393
                </strong>{" "}
                Template Build
              </span>
              <span>
                <strong className="font-display text-base text-[#E6EAF5]">
                  262
                </strong>{" "}
                Kombo Skill
              </span>
              <span>
                <strong className="font-display text-base text-[#4ADE80]">
                  4
                </strong>{" "}
                Bracket Rank Meta
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Kartu Sorotan #1 Meta Leader (Octagon Cut + Skin Premium) */}
          {topLeader && (
            <Link
              href={`/heroes/${topLeader.heroSlug}`}
              className="mlbb-octagon-frame group relative flex min-h-[300px] flex-col justify-between overflow-hidden border border-[#22D3EE]/35 bg-[#0A0E1A] p-6 transition hover:border-[#F5B83D]/70 sm:min-h-[350px]"
            >
              <HeroSkinBackdrop
                skin={topLeaderSkin}
                heroName={topLeader.heroName}
                variant="card"
              />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                <span className="font-display bg-[#F5B83D] px-3 py-0.5 text-sm text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.5)]">
                  #1 Meta · Tier {topLeader.tier}
                </span>
                <span className="font-display border border-[#22D3EE]/50 bg-[#0A0E1A]/80 px-2.5 py-0.5 text-xs text-[#22D3EE]">
                  Mythical Glory+
                </span>
              </div>

              <div className="relative z-10 my-4 flex items-center gap-4">
                <HeroPortrait
                  slug={topLeader.heroSlug}
                  name={topLeader.heroName}
                  className="h-28 w-24 shrink-0 border-2 border-[#F5B83D]/60 shadow-[0_0_24px_rgba(245,184,61,0.25)]"
                />
                <div className="min-w-0 space-y-1.5">
                  <p className="text-xs font-semibold tracking-wider text-[#22D3EE] uppercase">
                    {topLeader.roles.join(" / ") || "Hero Meta"}
                  </p>
                  <p className="font-display mlbb-glow-gold truncate text-4xl leading-none text-[#F5B83D]">
                    {topLeader.heroName}
                  </p>
                  <p className="text-xs text-[#E6EAF5]/85">
                    {topLeader.lanes.join(" · ") || "Fleksibel"}
                  </p>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-white/15 pt-3.5">
                <div>
                  <p className="text-[10px] tracking-wider text-[#9AA6C4] uppercase">
                    Win Rate
                  </p>
                  <p className="font-display text-xl text-[#4ADE80]">
                    {formatPercent(topLeader.winRate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-[#9AA6C4] uppercase">
                    Ban Rate
                  </p>
                  <p className="font-display text-xl text-[#FB7185]">
                    {formatPercent(topLeader.banRate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-[#9AA6C4] uppercase">
                    Skor Meta
                  </p>
                  <p className="font-display text-xl text-[#F5B83D]">
                    {topLeader.metaScore}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Dashboard Meta Interaktif: Top 5 Bars + Sorotan + Tier List S-D */}
      <section aria-label="Dashboard Meta dan Tier List Hero">
        <MetaTierListBoard payload={metaPayload} patchLabel={patchLabel} />
      </section>

      {/* 4 Alat Strategi Utama */}
      <section aria-labelledby="core-tools-heading" className="space-y-5">
        <div>
          <h2
            id="core-tools-heading"
            className="mlbb-heading text-2xl text-[#E6EAF5] sm:text-3xl"
          >
            Alat Strategi Utama
          </h2>
          <p className="mt-1.5 text-xs text-[#9AA6C4] sm:text-sm">
            Sudah menemukan hero meta di Tier S? Langsung uji duel matchup,
            cari counter-nya, atau buka template build-nya.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CORE_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="mlbb-card group flex flex-col justify-between p-5 transition-all hover:-translate-y-0.5 hover:border-[#F5B83D]/60 hover:bg-[#15203E]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center border ${tool.accent}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Badge tone="blue">{tool.badge}</Badge>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-[#E6EAF5] transition-colors group-hover:text-[#F5B83D]">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9AA6C4]">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="font-display mt-4 inline-flex items-center gap-1.5 text-sm text-[#22D3EE] group-hover:text-[#F5B83D]">
                  <span>Buka Modul</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Modul Pendukung */}
      <section aria-labelledby="more-modules-heading" className="space-y-5">
        <h2
          id="more-modules-heading"
          className="mlbb-heading text-2xl text-[#E6EAF5] sm:text-3xl"
        >
          Panduan &amp; Eksplorasi Lainnya
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SECONDARY_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="mlbb-card group flex flex-col justify-between p-5 transition-all hover:-translate-y-0.5 hover:border-[#F5B83D]/60 hover:bg-[#15203E]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-[#22D3EE]/35 bg-[#0A0E1A] text-[#22D3EE]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <Badge tone="gold">{mod.badge}</Badge>
                  </div>
                  <h3 className="font-display mt-4 text-lg text-[#E6EAF5] group-hover:text-[#F5B83D]">
                    {mod.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#9AA6C4]">
                    {mod.description}
                  </p>
                </div>
                <div className="font-display mt-4 inline-flex items-center gap-1 text-xs text-[#22D3EE] group-hover:text-[#F5B83D]">
                  <span>Pelajari</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Prinsip Transparansi Ringkas */}
      <section aria-labelledby="trust-heading">
        <Surface className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#F5B83D]" />
              <div>
                <h3
                  id="trust-heading"
                  className="font-display text-sm text-[#E6EAF5]"
                >
                  Data Resmi &amp; Transparan
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9AA6C4]">
                  Statistik meta bersumber langsung dari API peringkat resmi
                  Moonton GMS tanpa angka rekayasa.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Layers3 className="mt-0.5 h-5 w-5 shrink-0 text-[#22D3EE]" />
              <div>
                <h3 className="font-display text-sm text-[#E6EAF5]">
                  Sadar Perubahan Patch
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9AA6C4]">
                  Original Server dipisahkan tegas dari Advance Server agar kamu
                  tidak memakai panduan usang.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Compass className="mt-0.5 h-5 w-5 shrink-0 text-[#4ADE80]" />
              <div>
                <h3 className="font-display text-sm text-[#E6EAF5]">
                  Realistis untuk Ranked
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9AA6C4]">
                  Strategi pro selalu disesuaikan syarat komunikasinya untuk
                  Solo, Duo, Trio, dan 5-Man.
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  );
}
