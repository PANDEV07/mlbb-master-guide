import { buildPageMetadata } from "@/lib/metadata";
import { getCurrentLivePatch } from "@/services/repositories/governanceRepository";
import { AcademyWorkspaceClient } from "@/features/academy/components/AcademyWorkspaceClient";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = buildPageMetadata(
  "Akademi Ranked",
  "Kurikulum peningkatan ranked Mobile Legends: Bang Bang untuk Solo, Duo, Trio, dan 5-Man Squad berbasis adaptasi strategi turnamen global."
);

export const revalidate = 3600;

export default async function AcademyPage() {
  const livePatch = await getCurrentLivePatch("ORIGINAL_SERVER").catch(
    () => null,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Akademi Ranked (Solo · Duo · Trio · 5-Man)"
        description="Tips, trik, dan adaptasi strategi turnamen global MLBB yang disesuaikan secara realistis dengan tingkat koordinasi party."
        breadcrumbs={[{ label: "Akademi" }]}
        phaseBadge={
          livePatch ? `Patch ${livePatch.versionCode}` : "Original Server"
        }
        statusLabel="4 Jalur Ranked"
      />

      <AcademyWorkspaceClient
        livePatchVersion={livePatch?.versionCode ?? null}
        liveSeasonLabel={livePatch?.seasonLabel ?? null}
      />
    </div>
  );
}
