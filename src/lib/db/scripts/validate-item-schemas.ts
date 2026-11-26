import { itemIdentitySchema } from "@/features/items/schemas/item.schema";
import {
  itemProfileSchema,
  itemPassiveEffectSchema,
  itemActiveEffectSchema,
  itemStatEfficiencySchema,
} from "@/features/items/schemas/item-profile.schema";

const identity = itemIdentitySchema.safeParse({
  canonicalId: "test-item-001",
  name: "Blade of Despair",
  slug: "blade-of-despair",
  category: "Attack",
  tier: "TIER_3",
});

const identityInvalid = itemIdentitySchema.safeParse({
  canonicalId: "",
  name: "",
  slug: "invalid-item",
  category: "Unknown",
  tier: "Invalid",
});

const profile = itemProfileSchema.safeParse({
  schemaVersion: 1,
  category: "Attack",
  price: null,
});

const negativePrice = itemProfileSchema.safeParse({
  schemaVersion: 1,
  category: "Attack",
  price: -1,
});

const categoryConsistent =
  identity.success && profile.success &&
  identity.data.category === profile.data.category;

const mismatchProfile = itemProfileSchema.safeParse({
  schemaVersion: 1,
  category: "Magic",
  price: null,
});

const categoryMismatch =
  identity.success && mismatchProfile.success &&
  identity.data.category !== mismatchProfile.data.category;

const nullPriceAccepted =
  profile.success && profile.data.price === null;

const unverifiedEffect = itemProfileSchema.safeParse({
  schemaVersion: 1,
  category: "Attack",
  price: null,
  passiveEffects: [{
    name: "Test Effect",
    description: "Effect belum diverifikasi.",
    effectType: "UNKNOWN",
  }],
});

const unverifiedEffectPreserved =
  unverifiedEffect.success &&
  unverifiedEffect.data.passiveEffects[0]?.verificationStatus === "UNVERIFIED";

const uniqueWithoutGroup = itemPassiveEffectSchema.safeParse({
  name: "Unique Test",
  description: "Test",
  effectType: "DAMAGE",
  passiveKind: "UNIQUE_PASSIVE",
});

const uniqueWithGroup = itemPassiveEffectSchema.safeParse({
  name: "Unique Test",
  description: "Test",
  effectType: "DAMAGE",
  passiveKind: "UNIQUE_PASSIVE",
  passiveGroup: "TEST_GROUP",
});

const stackingWithoutRule = itemPassiveEffectSchema.safeParse({
  name: "Stack Test",
  description: "Test",
  effectType: "BUFF",
  passiveKind: "PASSIVE_STACKING",
});

const stackingWithRule = itemPassiveEffectSchema.safeParse({
  name: "Stack Test",
  description: "Test",
  effectType: "BUFF",
  passiveKind: "PASSIVE_STACKING",
  stackingRule: "STACKABLE",
});

const activeNullCooldown = itemActiveEffectSchema.safeParse({
  name: "Active Test",
  description: "Test",
  effectType: "UTILITY",
  cooldownSeconds: null,
  durationSeconds: null,
});

const activeNegativeCooldown = itemActiveEffectSchema.safeParse({
  name: "Active Test",
  description: "Test",
  effectType: "UTILITY",
  cooldownSeconds: -1,
  durationSeconds: null,
});

const efficiencyWithoutMethod = itemStatEfficiencySchema.safeParse({
  value: 10,
  unit: "%",
  methodology: "",
});

const results: [string, boolean][] = [
  ["Identity valid", identity.success],
  ["Identity invalid rejected", !identityInvalid.success],
  ["Profile valid", profile.success],
  ["Negative price rejected", !negativePrice.success],
  ["Category consistent", categoryConsistent],
  ["Category mismatch detected", categoryMismatch],
  ["Null price accepted", nullPriceAccepted],
  ["Unverified effect preserved", unverifiedEffectPreserved],
  ["Unique Passive requires group", !uniqueWithoutGroup.success],
  ["Unique Passive with group accepted", uniqueWithGroup.success],
  ["Passive Stacking requires rule", !stackingWithoutRule.success],
  ["Passive Stacking with rule accepted", stackingWithRule.success],
  ["Active null cooldown accepted", activeNullCooldown.success],
  ["Active negative cooldown rejected", !activeNegativeCooldown.success],
  ["Efficiency requires methodology", !efficiencyWithoutMethod.success],
];

for (const [name, passed] of results) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
}

if (results.some(([, passed]) => !passed)) {
  process.exitCode = 1;
} else {
  console.log(`\nSemua ${results.length} pengujian berhasil.`);
}