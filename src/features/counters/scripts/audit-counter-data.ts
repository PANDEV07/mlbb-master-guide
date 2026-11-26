import { getCurrentOriginalServerHeroes } from "@/features/heroes/repositories/hero.repository";
import { getItemCatalog } from "@/features/items/server/item.repository";

async function main() {
  const [heroResult, itemResult] = await Promise.all([
    getCurrentOriginalServerHeroes(),
    getItemCatalog(),
  ]);

  const heroes = heroResult.heroes;
  const items = itemResult.items;

  const heroesWithProfiles = heroes.filter((hero) => hero.profile !== null);
  const skillCount = heroesWithProfiles.reduce(
    (total, hero) => total + (hero.profile?.skills.length ?? 0),
    0,
  );

  const heroesWithSkills = heroesWithProfiles.filter(
    (hero) => (hero.profile?.skills.length ?? 0) > 0,
  );

  const itemsWithEffects = items.filter(
    (item) => item.passiveEffects.length > 0 || item.activeEffects.length > 0,
  );

  const itemStatuses = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.verificationStatus] =
      (counts[item.verificationStatus] ?? 0) + 1;
    return counts;
  }, {});

  console.log("\n========== COUNTER DATA AUDIT ==========");
  console.log("\nPATCH HERO:");
  console.log(JSON.stringify(heroResult.patch, null, 2));
  console.log("Total hero:", heroes.length);
  console.log("Hero dengan profile:", heroesWithProfiles.length);
  console.log("Hero dengan skill:", heroesWithSkills.length);
  console.log("Total skill profile:", skillCount);
  console.log("Invalid hero records:", heroResult.invalidRecords);

  console.log("\nPATCH ITEM:");
  console.log("Patch version:", itemResult.patchVersion);
  console.log("Total item:", items.length);
  console.log("Item dengan passive/active effects:", itemsWithEffects.length);
  console.log("Status verifikasi item:", JSON.stringify(itemStatuses, null, 2));

  console.log("\nPATCH CONSISTENCY:");
  console.log(
    "Hero patch ID:",
    heroResult.patch?.versionCode ?? "NO_CURRENT_HERO_PATCH",
  );
  console.log(
    "Item patch version:",
    itemResult.patchVersion ?? "NO_CURRENT_ITEM_PATCH",
  );

  console.log("\nSAMPLE HERO PROFILE:");
  const sampleHero = heroesWithSkills[0];
  if (sampleHero) {
    console.log(JSON.stringify({
      name: sampleHero.metadata.name,
      slug: sampleHero.metadata.slug,
      skills: sampleHero.profile?.skills.slice(0, 3).map((skill) => ({
        name: skill.name,
        slot: skill.slot ?? null,
        apiSkillId: skill.apiSkillId,
        apiGroupId: skill.apiGroupId,
        descriptionLength: skill.description.length,
        mechanicCategories: skill.mechanicCategories,
        mechanics: skill.mechanics,
      })),
    }, null, 2));
  } else {
    console.log("Belum ada hero dengan skill profile.");
  }

  console.log("\nSAMPLE ITEM:");
  const sampleItem = items[0];
  if (sampleItem) {
    console.log(JSON.stringify({
      name: sampleItem.name,
      category: sampleItem.category,
      verificationStatus: sampleItem.verificationStatus,
      attributes: sampleItem.attributes,
      passiveEffects: sampleItem.passiveEffects,
      activeEffects: sampleItem.activeEffects,
    }, null, 2));
  } else {
    console.log("Item catalog kosong.");
  }

  console.log("\n========== AUDIT SELESAI ==========");
}

main().catch((error: unknown) => {
  console.error("Counter data audit gagal:", error);
  process.exitCode = 1;
});