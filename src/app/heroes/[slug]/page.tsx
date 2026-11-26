import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, ChevronDown, ExternalLink } from "lucide-react";
import { getHeroGameplayCandidate } from "../../../features/heroes/data/hero-gameplay-candidates";
import {
  getHeroComboCollection,
  getHeroSkillGroupsForDisplay,
} from "@/features/heroes/data/hero-combos";
import { HeroSkillShowcase } from "@/features/heroes/components/HeroSkillShowcase";
import { HeroCombosPanel } from "@/features/heroes/components/HeroCombosPanel";
import { getHeroDetail } from "@/features/heroes";
import { PageHeader } from "@/components/shared/PageHeader";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/heroes"
          className="inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
        >
          ← Kembali ke Database Hero
        </Link>
        <Link
          href={`/builds/${hero.metadata.slug}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Lihat Template Build {hero.metadata.name} →
        </Link>
      </div>

      <PageHeader
        title={hero.metadata.name}
        description="Profil Lengkap Hero — Mobile Legends: Bang Bang"
        breadcrumbs={[
          { label: "Hero", href: "/heroes" },
          { label: hero.metadata.name },
        ]}
        phaseBadge={patch?.versionCode ? `Patch ${patch.versionCode}` : undefined}
        statusLabel="Original Server"
      />

      <Surface className="overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <HeroPortrait
            slug={hero.metadata.slug}
            name={hero.metadata.name}
            className="h-36 w-36 text-4xl"
          />

          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
              Profil Hero
            </div>
            <h2 className="mt-1.5 text-3xl font-bold text-white">
              {hero.metadata.name}
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="emerald">Original Server</Badge>
              {profile ? (
                <>
                  <Badge tone="blue">{profile.role}</Badge>
                  <Badge tone="neutral">{profile.damageType}</Badge>
                </>
              ) : (
                <Badge tone="neutral">Profil atribut belum tersedia</Badge>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-400">
              Patch aktif: {patch?.versionCode ?? "Belum tersedia"}
              {patch?.seasonLabel ? ` · ${patch.seasonLabel}` : ""}
            </div>

            {hero.metadata.releaseDate && (
              <div className="mt-1 text-xs text-slate-500">
                Tanggal rilis: {hero.metadata.releaseDate}
              </div>
            )}
          </div>
        </div>
      </Surface>

      {profile && (
        <>
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">Ringkasan Hero</h2>
            <Surface className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="mb-2 text-xs text-slate-500">Peran (Role)</div>
                <Badge tone="blue">{profile.role}</Badge>
              </div>

              <div>
                <div className="mb-2 text-xs text-slate-500">Spesialisasi</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.specialties.length > 0 ? (
                    profile.specialties.map((value) => (
                      <Badge key={value} tone="neutral">
                        {value}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      Belum tersedia
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-slate-500">Lane Utama</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.lanes.map((lane) => (
                    <Badge key={lane} tone="neutral">
                      {lane}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-slate-500">
                  Tingkat Kesulitan
                </div>
                <div className="text-lg font-bold text-white">
                  {profile.difficulty}/5
                </div>
              </div>
            </Surface>
          </section>

          {profile.skills.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Skill Profil</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {profile.skills.map((skill) => (
                  <Surface key={skill.slot} className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone="emerald">
                        {skill.slot
                          ? (skillLabels[skill.slot] ?? skill.slot)
                          : "Slot belum diverifikasi"}
                      </Badge>
                      {skill.damageType && (
                        <Badge tone="neutral">{skill.damageType}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{skill.name}</h3>
                    <p className="text-sm leading-6 text-[#9FB0BE]">
                      {skill.description}
                    </p>
                    {skill.cooldownSeconds && (
                      <p className="text-xs text-slate-500">
                        Cooldown: {skill.cooldownSeconds} detik
                      </p>
                    )}
                    {skill.mechanics.length > 0 && (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-[#9FB0BE]">
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
                <h2 className="text-xl font-bold text-white">Atribut Dasar</h2>
                <Surface className="p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(profile.attributes).map(
                      ([key, value]) =>
                        value !== undefined && (
                          <div
                            key={key}
                            className="rounded-xl border border-[#1E2A33] bg-[#0B1014] p-3"
                          >
                            <div className="text-xs text-slate-400">
                              {attributeLabels[key] ?? key}
                            </div>
                            <div className="mt-1 font-bold text-white">
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
                  <h2 className="font-semibold text-white">{section.title}</h2>
                  {section.values.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm text-[#9FB0BE]">
                      {section.values.map((value, index) => (
                        <li key={index}>{value}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Belum tersedia.</p>
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
              <h3 className="font-semibold text-white">
                Ringkasan Kategori Mekanik Hero
              </h3>
              <p className="text-xs text-[#9FB0BE]">
                Kategori kemampuan yang dipetakan dari seluruh skill hero ini.
              </p>
              <div className="flex flex-wrap gap-2">
                {candidateMechanicCategories.map((category) => (
                  <Badge key={category} tone="emerald">
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
                className="h-4 w-4 text-emerald-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-bold text-white">
                  Sumber Referensi &amp; Status Verifikasi Data
                </h2>
                <p className="text-xs text-[#9FB0BE]">
                  {evidences.length > 0
                    ? `${evidences.length} sumber rujukan tercatat (${evidences.map((e) => e.sourceName).join(", ")})`
                    : "Belum ada sumber rujukan yang tercatat untuk hero ini."}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#243440] bg-[#0B1014] px-3 py-1 text-[11px] font-medium text-slate-300 transition group-hover:border-emerald-400/40 group-hover:text-emerald-200">
              <span>Lihat rincian</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>

          <div className="mt-4 space-y-3 border-t border-[#1E2A33] pt-4">
            {evidences.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="space-y-3 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {evidence.sourceName}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400">
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
                        <p className="text-[11px] text-slate-500">Aspek Data</p>
                        <p className="font-medium text-slate-200">
                          {formatEvidenceAspectId(evidence.aspectName)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Klasifikasi
                        </p>
                        <p className="font-medium text-slate-200">
                          {formatClaimClassificationId(
                            evidence.claimClassification,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Tingkat Keyakinan
                        </p>
                        <p className="font-medium text-slate-200">
                          {formatConfidenceLevelId(evidence.confidenceLevel)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Sikap Bukti
                        </p>
                        <p className="font-medium text-slate-200">
                          {formatEvidenceStanceId(evidence.stance)}
                        </p>
                      </div>
                    </div>

                    {evidence.evidenceExcerpt && (
                      <p className="rounded-lg border border-[#1E2A33] bg-[#10161B] p-2.5 text-xs text-slate-300">
                        {evidence.evidenceExcerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2A33] pt-2.5 text-[11px]">
                      <span className="text-slate-500">
                        {evidence.verifiedAt
                          ? `Diverifikasi: ${new Date(evidence.verifiedAt).toLocaleDateString("id-ID")}`
                          : "Belum ada tanggal verifikasi"}
                      </span>
                      {evidence.sourceUrl && (
                        <a
                          href={evidence.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-emerald-300 hover:underline"
                        >
                          Buka sumber <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[#9FB0BE]">
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
