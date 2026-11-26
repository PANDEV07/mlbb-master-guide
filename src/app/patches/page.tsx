import { buildPageMetadata } from "@/lib/metadata";
import { getPatchHubSnapshot } from "@/features/patches/server/patch-hub.repository";
import { PatchWorkspaceClient } from "@/features/patches/components/PatchWorkspaceClient";
import { KnowledgeFreshnessPanel } from "@/features/patches/components/KnowledgeFreshnessPanel";
import { SourceGovernancePanel } from "@/features/patches/components/SourceGovernancePanel";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = buildPageMetadata(
  "Pusat Patch & Meta",
  "Pelacakan pembaruan patch Original Server vs Advance Server, registry sumber, dan status kesegaran basis pengetahuan."
);

export const revalidate = 3600;

export default async function PatchesPage() {
  const snapshot = await getPatchHubSnapshot();
  const liveOriginalPatch = snapshot.patches.find(
    (patch) => patch.serverType === "ORIGINAL_SERVER" && patch.isCurrentLive,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Patch & Meta"
        description="Pantau versi patch aktif Original Server, pemisahan Advance Server, serta status kesegaran dan bukti seluruh basis pengetahuan."
        breadcrumbs={[{ label: "Patch" }]}
        phaseBadge={
          liveOriginalPatch
            ? `Patch ${liveOriginalPatch.versionCode}`
            : "Original Server"
        }
        statusLabel={liveOriginalPatch?.seasonLabel ?? "Pantauan Aktif"}
      />

      <PatchWorkspaceClient
        patches={snapshot.patches}
        changes={snapshot.changes}
      />

      <KnowledgeFreshnessPanel
        evidenceHealth={snapshot.evidenceHealth}
        evidenceBuckets={snapshot.evidenceBuckets}
        inventory={snapshot.inventory}
      />

      <SourceGovernancePanel sources={snapshot.sources} />
    </div>
  );
}
