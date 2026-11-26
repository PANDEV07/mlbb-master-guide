import { notFound } from "next/navigation";
import Link from "next/link";
import { getHeroDetail } from "@/features/heroes";
import { getItemCatalog } from "@/features/items/server/item.repository";
import { getHeroBuildTemplates } from "@/features/builds/server";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { BuildDraftWorkbench } from "@/features/builds/components/BuildDraftWorkbench";
import { PageHeader } from "@/components/shared/PageHeader";

type Props = {
  params: Promise<{ heroSlug: string }>;
};

export default async function HeroBuildPage({ params }: Props) {
  const { heroSlug } = await params;

  const [heroDetail, catalog] = await Promise.all([
    getHeroDetail(heroSlug),
    getItemCatalog(),
  ]);

  if (!heroDetail?.hero) notFound();

  const hero = heroDetail.hero;
  const { templates } = await getHeroBuildTemplates(hero.entityId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Build ${hero.metadata.name}`}
        description="Pilih item melalui ikon untuk menyusun build hero ini."
        breadcrumbs={[
          { label: "Builds", href: "/builds" },
          { label: hero.metadata.name },
        ]}
      />

      <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-[#111927] p-4">
        <HeroPortrait
          slug={hero.metadata.slug}
          name={hero.metadata.name}
          className="h-20 w-20 rounded-2xl"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">{hero.metadata.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {hero.profile
              ? `${hero.profile.role} · ${hero.profile.lanes.join(", ")}`
              : "Profil gameplay belum tersedia"}
          </p>
          <Link
            href="/builds"
            className="mt-2 inline-block text-xs text-amber-300 hover:underline"
          >
            ← Ganti hero
          </Link>
        </div>
      </div>

      <BuildDraftWorkbench
        hero={hero}
        items={catalog.items}
        patchVersion={catalog.patchVersion}
        templates={templates}
      />
    </div>
  );
}