/**
 * Pemetaan terpusat enum teknis sistem ke label Bahasa Indonesia yang ramah pengguna.
 */

export function formatVerificationStatusId(status: string): string {
  switch (status.toUpperCase()) {
    case "VERIFIED":
      return "Terverifikasi";
    case "PARTIAL":
    case "PARTIALLY_VERIFIED":
      return "Verifikasi Parsial";
    case "UNVERIFIED":
      return "Belum Diverifikasi";
    case "OUTDATED":
    case "STALE":
      return "Perlu Diperbarui";
    case "CONFLICTING":
      return "Data Bertentangan";
    case "NOT_RESEARCHED":
      return "Belum Diteliti";
    case "NOT_YET_AVAILABLE":
      return "Belum Tersedia";
    case "NOT_FOUND":
      return "Tidak Ditemukan";
    default:
      return "Belum Diketahui";
  }
}

export function formatSourceTierId(tier: string): string {
  switch (tier.toUpperCase()) {
    case "TIER_1_OFFICIAL":
      return "Sumber Resmi (Tier 1)";
    case "TIER_2_SECONDARY":
      return "Database Sekunder (Tier 2)";
    case "TIER_3_ANALYTICAL":
      return "Sumber Analitis (Tier 3)";
    case "TIER_4_COMMUNITY":
      return "Sumber Komunitas (Tier 4)";
    default:
      return tier.replaceAll("_", " ");
  }
}

export function formatClaimClassificationId(value: string): string {
  switch (value.toUpperCase()) {
    case "OFFICIAL_FACT":
    case "VERIFIED_FACT":
      return "Fakta Resmi";
    case "SECONDARY_SOURCE":
      return "Sumber Sekunder";
    case "RESEARCH_BASED_ANALYSIS":
      return "Analisis Berbasis Riset";
    case "STRATEGIC_INTERPRETATION":
      return "Interpretasi Strategis";
    case "MECHANIC_EVIDENCE":
      return "Bukti Mekanik";
    case "COMMUNITY_THEORY":
      return "Teori Komunitas";
    case "UNKNOWN":
      return "Belum Diklasifikasikan";
    default:
      return value.replaceAll("_", " ");
  }
}

export function formatConfidenceLevelId(level: string): string {
  switch (level.toUpperCase()) {
    case "HIGH":
      return "Tinggi";
    case "MEDIUM":
      return "Sedang";
    case "LOW":
      return "Rendah";
    default:
      return level;
  }
}

export function formatEvidenceStanceId(stance: string): string {
  switch (stance.toUpperCase()) {
    case "SUPPORTING":
      return "Mendukung";
    case "CONTRADICTING":
      return "Bertentangan";
    case "NEUTRAL":
      return "Netral";
    default:
      return stance;
  }
}

export function formatEvidenceAspectId(aspect: string): string {
  switch (aspect.toUpperCase()) {
    case "IDENTITY":
      return "Identitas Hero";
    case "SKILLS":
      return "Mekanik Skill";
    case "ATTRIBUTES":
      return "Atribut Dasar";
    case "ITEM_PRICE":
      return "Harga Item";
    case "ITEM_ATTRIBUTES":
      return "Atribut Item";
    case "ITEM_PASSIVE_EFFECTS":
      return "Efek Pasif";
    case "ITEM_ACTIVE_EFFECTS":
      return "Efek Aktif";
    case "ITEM_RECIPE":
      return "Resep Item";
    case "HERO_BUILD":
      return "Template Build";
    default:
      return aspect.replaceAll("_", " ");
  }
}

export function formatRecipeTypeId(recipeType: string): string {
  switch (recipeType.toUpperCase()) {
    case "COMPOSITE_ITEM":
      return "Item Gabungan";
    case "BASIC_ITEM":
      return "Item Dasar";
    case "SPECIAL_ITEM":
      return "Item Khusus";
    default:
      return recipeType.replaceAll("_", " ");
  }
}

export function formatMechanicCategoryId(category: string): string {
  const map: Record<string, string> = {
    DAMAGE: "Damage",
    CROWD_CONTROL: "Crowd Control",
    MOBILITY: "Mobilitas",
    DEFENSE: "Pertahanan",
    SUSTAIN: "Sustain",
    BUFF_DEBUFF: "Buff & Debuff",
    UTILITY: "Utilitas",
    SPECIAL: "Mekanik Khusus",
  };
  return map[category.toUpperCase()] ?? category.replaceAll("_", " ");
}
