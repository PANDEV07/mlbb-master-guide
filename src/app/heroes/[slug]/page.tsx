import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, ChevronDown, ExternalLink } from "lucide-react";
import { getHeroGameplayCandidate } from "../../../features/heroes/data/hero-gameplay-candidates";
import {
  getHeroComboCollection,
  getHeroSkillGroupsForDisplay,
} from "@/features/heroes/data/hero-combos";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { getHeroPremiumSkin } from "@/features/heroes/data/hero-premium-skins";
import { HeroSkinBackdrop } from "@/features/heroes/components/HeroSkinBackdrop";
import { HeroSkillShowcase } from "@/features/heroes/components/HeroSkillShowcase";
import { HeroCombosPanel } from "@/features/heroes/components/HeroCombosPanel";
import { getHeroDetail } from "@/features/heroes";
import { formatPercent, getMetaDashboardPayload } from "@/features/meta";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "@/features/matchups/engine/mechanic-extractor";
import { analyzeHeroProfileInsights } from "@/features/heroes/engine/hero-profile-insights";
import { HeroProfileInsightsPanel } from "@/features/heroes/components/HeroProfileInsightsPanel";
import {
  formatClaimClassificationId,
  formatConfidenceLevelId,
  formatEvidenceAspectId,
  formatEvidenceStanceId,
  formatMechanicCategoryId,
  formatSourceTierId,
  formatVerificationStatusId,
} from "@/lib/i18n/labels";

type HeroDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

const attributeLabels: Record<string, string> = {
  hp: "HP",
  hpRegen: "Regenerasi HP",
  mana: "Mana",
  manaRegen: "Regenerasi Mana",
  physicalAttack: "Physical Attack",
  magicPower: "Magic Power",
  physicalDefense: "Physical Defense",
  magicDefense: "Magic Defense",
  attackSpeed: "Attack Speed",
  movementSpeed: "Movement Speed",
  attackRange: "Jarak Serang",
};

const skillLabels: Record<string, string> = {
  PASSIVE: "Pasif",
  SKILL_1: "Skill 1",
  SKILL_2: "Skill 2",
  SKILL_3: "Skill 3",
  ULTIMATE: "Ultimate",
};

const TIER_BADGE_CLASSES: Record<string, string> = {
  S: "bg-[#F5B83D] text-[#0A0E1A]",
  A: "bg-[#22D3EE] text-[#0A0E1A]",
  B: "bg-[#4ADE80] text-[#0A0E1A]",
  C: "bg-[#94A3B8] text-[#0A0E1A]",
  D: "bg-[#E11D48] text-white",
};

export default async function HeroDetailPage({
  params,
}: HeroDetailPageProps) {
  const { slug } = await params;
  const result = await getHeroDetail(slug);

  if (!result) notFound();

  const { hero, patch, evidences } = result;
  const profile = hero.profile;
  const gameplayCandidate = getHeroGameplayCandidate(hero.metadata.name);
  const insightRecords = gameplayCandidate
    ? extractHeroMechanics([gameplayCandidate] as GameplayCandidateHero[])
    : [];
  const displaySkillGroups = getHeroSkillGroupsForDisplay(hero.metadata.name);
  const comboCollection = getHeroComboCollection(
    hero.metadata.slug,
    hero.metadata.name,
  );

  const heroInsights = analyzeHeroProfileInsights(
    hero.metadata.name,
    insightRecords,
  );
  const candidateMechanicCategories = gameplayCandidate
    ? [
        ...new Set(
          gameplayCandidate.skillGroups.flatMap((group) =>
            group.skills.flatMap((skill) => skill.mechanicCategories ?? []),
          ),
        ),
      ]
    : [];

  const metaPayload = getMetaDashboardPayload();
  const metaHero = metaPayload.brackets.mythical_glory.heroes.find(
    (h) => h.heroSlug === hero.metadata.slug,
  );
  const premiumSkin = getHeroPremiumSkin(hero.metadata.slug);
  const displayRoles =
    profile?.role
      ? [profile.role]
      : (HERO_ROLE_MAP[hero.metadata.slug] ?? []);
  const displayLanes =
    profile?.lanes && profile.lanes.length > 0
      ? profile.lanes
      : (HERO_LANE_MAP[hero.metadata.slug] ?? []);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            { label: "Hero", href: "/heroes" },
            { label: hero.metadata.name },
          ]}
        />
        <Link
          href="/heroes"
          className="font-display text-sm text-[#22D3EE] transition hover:text-[#F5B83D]"
        >
          ← Kembali ke Database Hero
        </Link>
      </div>

      {/* Hero Detail Banner + Statistik Patch Ini (Referensi Detail Hero) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="mlbb-card relative min-h-[260px] overflow-hidden bg-[#0A0E1A] p-6 sm:min-h-[290px] sm:p-8">
          <HeroSkinBackdrop
            skin={premiumSkin}
            heroName={hero.metadata.name}
            variant="banner"
          />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end">
            <HeroPortrait
              slug={hero.metadata.slug}
              name={hero.metadata.name}
              className="h-36 w-32 shrink-0 border-2 border-[#F5B83D]/60 shadow-[0_0_24px_rgba(245,184,61,0.3)]"
            />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {displayRoles.map((r) => (
                  <span
                    key={r}
                    className="font-display bg-[#22D3EE] px-3 py-0.5 text-sm text-[#0A0E1A]"
                  >
                    {r}
                  </span>
                ))}
                {displayLanes.slice(0, 2).map((l) => (
                  <span
                    key={l}
                    className="font-display bg-[#F5B83D] px-3 py-0.5 text-sm text-[#0A0E1A]"
                  >
                    {l}
                  </span>
                ))}
                {metaHero && (
                  <span
                    className={`font-display px-3 py-0.5 text-sm ${TIER_BADGE_CLASSES[metaHero.tier] ?? "bg-[#F5B83D] text-[#0A0E1A]"}`}
                  >
                    Tier {metaHero.tier}
                  </span>
                )}
              </div>

              <h1 className="font-display mlbb-glow-gold text-5xl leading-[0.95] text-[#E6EAF5] sm:text-6xl">
                {hero.metadata.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9AA6C4]">
                <span>Original Server</span>
                <span>•</span>
                <span>Patch {patch?.versionCode ?? "2.2.23"}</span>
                {patch?.seasonLabel && (
                  <>
                    <span>•</span>
                    <span>{patch.seasonLabel}</span>
                  </>
                )}
                {hero.metadata.releaseDate && (
                  <>
                    <span>•</span>
                    <span>Rilis: {hero.metadata.releaseDate}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button href={`/builds/${hero.metadata.slug}`} variant="primary">
                  Template Build {hero.metadata.name}
                </Button>
                <Button href="/counters" variant="secondary">
                  Cari Counter
                </Button>
                <Button href="/matchups" variant="secondary">
                  Uji Matchup
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Statistik Patch Ini (Data Resmi Moonton GMS) */}
        <Surface className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl text-[#F5B83D]">
                Statistik Patch Ini
              </h2>
              <Badge tone="blue">Glory+</Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-[#9AA6C4]">
              Data resmi Moonton GMS (Patch {patch?.versionCode ?? "2.2.23"}).
            </p>

            {metaHero ? (
              <div className="mt-4 divide-y divide-white/10">
                <div className="py-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-[#9AA6C4]">Win Rate</span>
                    <b className="font-display text-lg text-[#F5B83D]">
                      {formatPercent(metaHero.winRate)}
                    </b>
                  </div>
                  <div className="h-1.5 bg-[#1B2442]">
                    <div
                      className="h-1.5 bg-[#F5B83D] shadow-[0_0_8px_#F5B83D]"
                      style={{
                        width: `${Math.min(100, Math.max(10, metaHero.winRate * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="py-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-[#9AA6C4]">Pick Rate</span>
                    <b className="font-display text-lg text-[#22D3EE]">
                      {formatPercent(metaHero.pickRate)}
                    </b>
                  </div>
                  <div className="h-1.5 bg-[#1B2442]">
                    <div
                      className="h-1.5 bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"
                      style={{
                        width: `${Math.min(100, Math.max(8, metaHero.pickRate * 100 * 28))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="py-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-[#9AA6C4]">Ban Rate</span>
                    <b className="font-display text-lg text-[#FB7185]">
                      {formatPercent(metaHero.banRate)}
                    </b>
                  </div>
                  <div className="h-1.5 bg-[#1B2442]">
                    <div
                      className="h-1.5 bg-[#E11D48] shadow-[0_0_8px_#E11D48]"
                      style={{
                        width: `${Math.min(100, Math.max(6, metaHero.banRate * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-[#9AA6C4]">
                Data statistik meta untuk hero ini belum tersedia pada snapshot
                saat ini.
              </p>
            )}
          </div>

          {metaHero && (
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
              <span className="text-[#9AA6C4]">Skor Komposit Meta</span>
              <span className="font-display text-lg text-[#F5B83D]">
                {metaHero.metaScore} / 100
              </span>
            </div>
          )}
        </Surface>
      </div>

      {profile && (
        <>
          <section className="space-y-3">
            <h2 className="mlbb-heading text-2xl text-[#E6EAF5]">
              Ringkasan Hero
            </h2>
            <Surface className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="mb-2 text-xs text-[#9AA6C4]">Peran (Role)</div>
                <Badge tone="blue">{profile.role}</Badge>
              </div>

              <div>
                <div className="mb-2 text-xs text-[#9AA6C4]">Spesialisasi</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.specialties.length > 0 ? (
                    profile.specialties.map((value) => (
                      <Badge key={value} tone="neutral">
                        {value}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-[#9AA6C4]">
                      Belum tersedia
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-[#9AA6C4]">Lane Utama</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.lanes.map((lane) => (
                    <Badge key={lane} tone="gold">
                      {lane}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-[#9AA6C4]">
                  Tingkat Kesulitan
                </div>
                <div className="font-display text-2xl text-[#F5B83D]">
                  {profile.difficulty}/5
                </div>
              </div>
            </Surface>
          </section>

          {profile.skills.length > 0 && (
            <section className="space-y-3">
              <h2 className="mlbb-heading text-2xl text-[#E6EAF5]">
                Skill Profil
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {profile.skills.map((skill) => (
                  <Surface key={skill.slot} className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone="gold">
                        {skill.slot
                          ? (skillLabels[skill.slot] ?? skill.slot)
                          : "Slot belum diverifikasi"}
                      </Badge>
                      {skill.damageType && (
                        <Badge tone="blue">{skill.damageType}</Badge>
                      )}
                    </div>
                    <h3 className="font-display text-lg text-[#E6EAF5]">
                      {skill.name}
                    </h3>
                    <p className="text-sm leading-6 text-[#9AA6C4]">
                      {skill.description}
                    </p>
                    {skill.cooldownSeconds && (
                      <p className="text-xs text-[#22D3EE]">
                        Cooldown: {skill.cooldownSeconds} detik
                      </p>
                    )}
                    {skill.mechanics.length > 0 && (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-[#9AA6C4]">
                        {skill.mechanics.map((mechanic, index) => (
                          <li key={index}>{mechanic}</li>
                        ))}
                      </ul>
                    )}
                  </Surface>
                ))}
              </div>
            </section>
          )}

          {profile.attributes &&
            Object.entries(profile.attributes).some(
              ([, value]) => value !== undefined,
            ) && (
              <section className="space-y-3">
                <h2 className="mlbb-heading text-2xl text-[#E6EAF5]">
                  Atribut Dasar
                </h2>
                <Surface className="p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(profile.attributes).map(
                      ([key, value]) =>
                        value !== undefined && (
                          <div
                            key={key}
                            className="border border-[#22D3EE]/25 bg-[#0A0E1A] p-3"
                          >
                            <div className="text-xs text-[#9AA6C4]">
                              {attributeLabels[key] ?? key}
                            </div>
                            <div className="font-display mt-1 text-lg text-[#F5B83D]">
                              {value}
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                </Surface>
              </section>
            )}

          {(profile.strengths.length > 0 ||
            profile.weaknesses.length > 0 ||
            profile.mechanics.length > 0) && (
            <section className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Kelebihan", values: profile.strengths },
                { title: "Kelemahan", values: profile.weaknesses },
                { title: "Mekanik Utama", values: profile.mechanics },
              ].map((section) => (
                <Surface key={section.title} className="space-y-3 p-5">
                  <h2 className="font-display text-lg text-[#F5B83D]">
                    {section.title}
                  </h2>
                  {section.values.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm text-[#9AA6C4]">
                      {section.values.map((value, index) => (
                        <li key={index}>{value}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#9AA6C4]">Belum tersedia.</p>
                  )}
                </Surface>
              ))}
            </section>
          )}
        </>
      )}

      {displaySkillGroups.length > 0 && (
        <div className="space-y-5">
          <HeroSkillShowcase
            heroName={hero.metadata.name}
            skillGroups={displaySkillGroups}
          />

          {candidateMechanicCategories.length > 0 && (
            <Surface className="space-y-3 p-5">
              <h3 className="font-display text-lg text-[#F5B83D]">
                Ringkasan Kategori Mekanik Hero
              </h3>
              <p className="text-xs text-[#9AA6C4]">
                Kategori kemampuan yang dipetakan dari seluruh skill hero ini.
              </p>
              <div className="flex flex-wrap gap-2">
                {candidateMechanicCategories.map((category) => (
                  <Badge key={category} tone="blue">
                    {formatMechanicCategoryId(category)}
                  </Badge>
                ))}
              </div>
            </Surface>
          )}
        </div>
      )}

      {comboCollection && <HeroCombosPanel collection={comboCollection} />}

      <HeroProfileInsightsPanel insights={heroInsights} />

      {/* Sumber Referensi & Status Data — Ringkas & Collapsible */}
      <Surface className="p-4 sm:p-5">
        <details className="group">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <BookOpenCheck
                className="h-4 w-4 text-[#F5B83D]"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-display text-base text-[#E6EAF5]">
                  Sumber Referensi &amp; Status Verifikasi Data
                </h2>
                <p className="text-xs text-[#9AA6C4]">
                  {evidences.length > 0
                    ? `${evidences.length} sumber rujukan tercatat (${evidences.map((e) => e.sourceName).join(", ")})`
                    : "Belum ada sumber rujukan yang tercatat untuk hero ini."}
                </p>
              </div>
            </div>
            <span className="font-display inline-flex items-center gap-1 border border-[#22D3EE]/35 bg-[#0A0E1A] px-3 py-1 text-xs text-[#22D3EE] transition group-hover:border-[#F5B83D] group-hover:text-[#F5B83D]">
              <span>Lihat rincian</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>

          <div className="mt-4 space-y-3 border-t border-[#22D3EE]/20 pt-4">
            {evidences.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="space-y-3 border border-[#22D3EE]/20 bg-[#0A0E1A] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base text-[#E6EAF5]">
                          {evidence.sourceName}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-[#9AA6C4]">
                          {evidence.sourceDomain} ·{" "}
                          {formatSourceTierId(evidence.sourceTier)}
                        </p>
                      </div>
                      <Badge
                        tone={
                          evidence.verificationStatus === "VERIFIED"
                            ? "emerald"
                            : "neutral"
                        }
                      >
                        {formatVerificationStatusId(evidence.verificationStatus)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[11px] text-[#9AA6C4]">Aspek Data</p>
                        <p className="font-medium text-[#E6EAF5]">
                          {formatEvidenceAspectId(evidence.aspectName)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9AA6C4]">
                          Klasifikasi
                        </p>
                        <p className="font-medium text-[#E6EAF5]">
                          {formatClaimClassificationId(
                            evidence.claimClassification,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9AA6C4]">
                          Tingkat Keyakinan
                        </p>
                        <p className="font-medium text-[#E6EAF5]">
                          {formatConfidenceLevelId(evidence.confidenceLevel)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9AA6C4]">
                          Sikap Bukti
                        </p>
                        <p className="font-medium text-[#E6EAF5]">
                          {formatEvidenceStanceId(evidence.stance)}
                        </p>
                      </div>
                    </div>

                    {evidence.evidenceExcerpt && (
                      <p className="border border-[#22D3EE]/20 bg-[#101830] p-2.5 text-xs text-[#E6EAF5]">
                        {evidence.evidenceExcerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[11px]">
                      <span className="text-[#9AA6C4]">
                        {evidence.verifiedAt
                          ? `Diverifikasi: ${new Date(evidence.verifiedAt).toLocaleDateString("id-ID")}`
                          : "Belum ada tanggal verifikasi"}
                      </span>
                      {evidence.sourceUrl && (
                        <a
                          href={evidence.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-display inline-flex items-center gap-1 text-xs text-[#22D3EE] hover:text-[#F5B83D]"
                        >
                          Buka sumber <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[#9AA6C4]">
                Belum ada bukti sumber yang tercatat untuk hero ini pada patch
                aktif.
              </p>
            )}
          </div>
        </details>
      </Surface>
    </div>
  );
}
