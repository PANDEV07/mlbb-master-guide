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
import { getItemCatalog } from "@/features/items/server/item.repository";
import { getMetaDashboardPayload } from "@/features/meta";
import { MetaTierListBoard } from "@/features/meta/components/MetaTierListBoard";
import { Badge } from "@/components/ui/Badge";
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
    accent: "text-emerald-300 bg-emerald-500/15 border-emerald-400/30",
  },
  {
    href: "/counters",
    title: "Counter Hero & Item (1–5 Musuh)",
    badge: "Praktis",
    description:
      "Pilih 1 hingga 5 hero lawan untuk menemukan hero dan item penangkal terbaik terhadap Hard CC, mobilitas, damage, dan sustain.",
    icon: GitCompare,
    accent: "text-teal-300 bg-teal-500/15 border-teal-400/30",
  },
  {
    href: "/builds",
    title: "Panduan & Rakitan Build",
    badge: "393 Template",
    description:
      "Pilih 3 template build siap pakai untuk tiap hero atau susun konfigurasi item custom sesuai situasi pertandingan.",
    icon: Layers,
    accent: "text-sky-300 bg-sky-500/15 border-sky-400/30",
  },
  {
    href: "/heroes",
    title: "Database Hero & Kombo",
    badge: "133 Hero",
    description:
      "Pelajari skill interaktif, cooldown, mekanik, dan urutan kombo untuk seluruh hero Original Server.",
    icon: Shield,
    accent: "text-amber-200 bg-amber-400/15 border-amber-400/30",
  },
] as const;

const SECONDARY_MODULES = [
  {
    href: "/items",
    title: "Database Item",
    description: "Atribut, harga, efek pasif & aktif seluruh peralatan tempur.",
    icon: Package,
  },
  {
    href: "/academy",
    title: "Akademi Ranked",
    description: "Strategi realistis Solo, Duo, Trio & 5-Man dari studi pro.",
    icon: GraduationCap,
  },
  {
    href: "/patches",
    title: "Pusat Patch & Meta",
    description: "Status patch aktif Original Server dan kesegaran data.",
    icon: History,
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
    <div className="space-y-10">
      {/* Hero Dashboard Header + Pencarian Instan */}
      <section className="relative overflow-hidden rounded-3xl border border-[#1E2A33] bg-gradient-to-br from-[#10181E] via-[#0F151A] to-[#0B1115] p-6 sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">Original Server · Patch {patchLabel}</Badge>
            <Badge tone="neutral">Statistik Resmi Moonton GMS</Badge>
          </div>

          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
              Dashboard Meta &amp; Strategi{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Mobile Legends
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-[#9FB0BE] sm:text-base">
              Pantau Tier List S–D per Role dari data Win Rate, Ban Rate, dan
              Pick Rate resmi, lalu siapkan counter, build, serta draft 5v5
              dalam satu tempat.
            </p>
          </div>

          <HomeQuickSearch heroes={quickHeroes} items={quickItems} />

          {/* Pintasan Cepat & Ringkasan Katalog */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-slate-400">
            <span>
              <strong className="font-bold text-white">
                {heroDirectory.heroes.length || 133}
              </strong>{" "}
              Hero
            </span>
            <span>
              <strong className="font-bold text-white">
                {itemCatalog.items.length || 104}
              </strong>{" "}
              Item
            </span>
            <span>
              <strong className="font-bold text-white">393</strong> Template
              Build
            </span>
            <span>
              <strong className="font-bold text-white">262</strong> Kombo Skill
            </span>
            <span>
              <strong className="font-bold text-white">4</strong> Bracket Rank
              Meta
            </span>
          </div>
        </div>
      </section>

      {/* Dashboard Meta Interaktif: Sorotan Meta + Tier List S-D per Role */}
      <section aria-label="Dashboard Meta dan Tier List Hero">
        <MetaTierListBoard payload={metaPayload} patchLabel={patchLabel} />
      </section>

      {/* 4 Alat Strategi Utama */}
      <section aria-labelledby="core-tools-heading" className="space-y-4">
        <div>
          <h2
            id="core-tools-heading"
            className="text-lg font-bold tracking-tight text-white sm:text-xl"
          >
            Alat Strategi Utama
          </h2>
          <p className="mt-0.5 text-xs text-[#9FB0BE]">
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
                className="group flex flex-col justify-between rounded-2xl border border-[#1E2A33] bg-[#10161B]/90 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-400/45 hover:bg-[#141D24]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${tool.accent}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Badge tone="neutral">{tool.badge}</Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white transition-colors group-hover:text-emerald-300">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9FB0BE]">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <span>Buka Modul</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Modul Pendukung */}
      <section aria-labelledby="more-modules-heading" className="space-y-4">
        <h2
          id="more-modules-heading"
          className="text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          Eksplorasi Pengetahuan Lainnya
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SECONDARY_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group rounded-2xl border border-[#1E2A33] bg-[#10161B]/80 p-4 transition-all hover:border-emerald-400/40 hover:bg-[#141D24]"
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className="h-4 w-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-300" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-white group-hover:text-emerald-200">
                  {mod.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
                  {mod.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Prinsip Transparansi Ringkas */}
      <section aria-labelledby="trust-heading">
        <Surface className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <h3
                  id="trust-heading"
                  className="text-xs font-bold text-white"
                >
                  Data Resmi &amp; Transparan
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
                  Statistik meta bersumber langsung dari API peringkat resmi
                  Moonton GMS tanpa angka rekayasa.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              <div>
                <h3 className="text-xs font-bold text-white">
                  Sadar Perubahan Patch
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
                  Original Server dipisahkan tegas dari Advance Server agar kamu
                  tidak memakai panduan usang.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Compass className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <div>
                <h3 className="text-xs font-bold text-white">
                  Realistis untuk Ranked
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
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
