import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { getDraftHeroPool } from "@/features/draft/data/draft-hero-pool";
import { LiveDraftSimulatorClient } from "@/features/draft/components/LiveDraftSimulatorClient";

export const metadata = buildPageMetadata(
  "Live Draft Simulator (Ban/Pick MPL & Ranked)",
  "Simulasi Ban/Pick Mobile Legends: Bang Bang format Turnamen MPL (2 fase) dan Ranked Mythic 10-Ban dengan Asisten Rekomendasi Real-Time berbasis data resmi Moonton GMS, Lawan AI Drafter, dan tautan bagikan hasil draft.",
  {
    canonicalPath: "/draft",
    keywords: [
      "MLBB Draft Simulator",
      "Simulasi Ban Pick Mobile Legends",
      "Draft MPL MLBB",
      "Draft Ranked 10 Ban",
      "Asisten Draft Mobile Legends",
    ],
  },
);

export const revalidate = 3600;

export default async function DraftSimulatorPage() {
  const { heroPool, patchVersion } = await getDraftHeroPool();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Draft Simulator (Ban/Pick MPL & Ranked)"
        description="Latih skenario Ban/Pick format Turnamen MPL (2 fase) atau Ranked 10-Ban secara manual bersama tim maupun melawan AI Drafter dengan rekomendasi real-time berbasis data resmi Moonton GMS."
        breadcrumbs={[{ label: "Draft Simulator" }]}
      />

      <LiveDraftSimulatorClient
        heroPool={heroPool}
        patchVersion={patchVersion}
      />
    </div>
  );
}
