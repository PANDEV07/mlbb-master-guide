import fs from "node:fs";
import path from "node:path";
import { itemProfileSchema } from "../../../features/items/schemas/item-profile.schema";

type RawAttribute = {
  attribute: string;
  value: number;
  unit?: string;
  raw: string;
};

const inputPath = path.resolve("item-gameplay-final-candidates.json");
const outputPath = path.resolve("item-gameplay-validated.json");
const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const attributeMap: Record<string, string> = {
  "Physical Attack": "PHYSICAL_ATTACK",
  "Magic Power": "MAGIC_POWER",
  HP: "HP",
  Mana: "MANA",
  "Physical Defense": "PHYSICAL_DEFENSE",
  "Magic Defense": "MAGIC_DEFENSE",
  "Hybrid Defense": "OTHER",
  "HP Regen": "HP_REGEN",
  "Mana Regen": "MANA_REGEN",
  "Attack Speed": "ATTACK_SPEED",
  "Crit Chance": "CRITICAL_CHANCE",
  "Critical Chance": "CRITICAL_CHANCE",
  "Movement Speed": "MOVEMENT_SPEED",
  "Cooldown Reduction": "COOLDOWN_REDUCTION",
  Lifesteal: "LIFESTEAL",
  "Spell Vamp": "SPELL_VAMP",
  Penetration: "PENETRATION",
};

const validated = [];
const failures: { name: string; issues: string[] }[] = [];

for (const item of items) {
  const profile = item.profile;

  const attributes = (profile.attributes as RawAttribute[]).map((attribute) => {
    const type = attributeMap[attribute.attribute] ?? "OTHER";

    return {
      type,
      value: attribute.value,
      unit: attribute.unit === "%" ? "%" : null,
      description:
        type === "OTHER" ? attribute.raw : undefined,
    };
  });

  const candidate = {
    schemaVersion: 1,
    category: item.category,
    price: profile.price,
    combineCost: profile.combineCost ?? null,
    attributes,
    passiveEffects: profile.passiveEffects.map((effect: {
      name: string;
      description: string;
    }) => ({
      name: effect.name,
      description: effect.description,
      effectType: "UNKNOWN",
      passiveKind: "UNCLASSIFIED",
      verificationStatus: "UNVERIFIED",
    })),
    activeEffects: profile.activeEffects.map((effect: {
      name: string;
      description: string;
    }) => ({
      name: effect.name,
      description: effect.description,
      effectType: "UNKNOWN",
      cooldownSeconds: null,
      durationSeconds: null,
      verificationStatus: "UNVERIFIED",
    })),
  };

  const result = itemProfileSchema.safeParse(candidate);

  if (result.success) {
    validated.push({
      entity: {
        canonicalId: item.canonicalId,
        name: item.name,
        slug: item.slug,
      },
      profile: result.data,
      recipe: profile.recipe,
      availabilityRaw: profile.availabilityRaw,
      recommendationRaw: profile.recommendationRaw,
      provenance: item.provenance,
      originalGameplay: item.originalGameplay,
      originalRecipe: item.originalRecipe,
      originalCost: item.originalCost,
    });
  } else {
    failures.push({
      name: item.name,
      issues: result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    });
  }
}

fs.writeFileSync(outputPath, JSON.stringify(validated, null, 2), "utf8");

console.log("\n=== VALIDASI ITEM PROFILE ===");
console.log("Total kandidat:", items.length);
console.log("Valid:", validated.length);
console.log("Tidak valid:", failures.length);
console.log(
  "Total atribut tervalidasi:",
  validated.reduce((sum, item) => sum + item.profile.attributes.length, 0),
);
console.log(
  "Total passive tervalidasi:",
  validated.reduce((sum, item) => sum + item.profile.passiveEffects.length, 0),
);
console.log(
  "Total active tervalidasi:",
  validated.reduce((sum, item) => sum + item.profile.activeEffects.length, 0),
);

if (failures.length > 0) {
  console.log("\n=== DETAIL ERROR ===");
  for (const failure of failures.slice(0, 15)) {
    console.log(`\n${failure.name}`);
    for (const issue of failure.issues) console.log("-", issue);
  }
}

console.log("\nFile:", outputPath);