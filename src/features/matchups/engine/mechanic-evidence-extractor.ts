import type { ExtractedMechanicRecord } from "./mechanic-extractor";

export type SpecificMechanic =
  | "APPLY_STUN"
  | "APPLY_IMMOBILIZE"
  | "APPLY_AIRBORNE"
  | "APPLY_KNOCKBACK"
  | "APPLY_SLOW"
  | "REMOVE_SLOW"
  | "CONTROL_IMMUNITY"
  | "CC_REMOVAL"
  | "UNTARGETABLE"
  | "INVULNERABLE"
  | "DASH"
  | "BLINK"
  | "SHIELD"
  | "DAMAGE_REDUCTION"
  | "HEALING"
  | "PHYSICAL_DAMAGE"
  | "MAGIC_DAMAGE"
  | "TRUE_DAMAGE";

export type EvidencePolarity = "APPLIED" | "REMOVED" | "PROTECTED";

export interface MechanicEvidence {
  mechanic: SpecificMechanic;
  polarity: EvidencePolarity;
  evidenceText: string;
  start: number;
  end: number;
  verificationStatus: "UNVERIFIED";
}

export interface SkillMechanicEvidence {
  heroName: string;
  skillName: string;
  apiSkillId: string | number | null;
  apiGroupId: string | number;
  sourceDataset: "hero-gameplay-normalized.json";
  evidence: MechanicEvidence[];
  verificationStatus: "UNVERIFIED";
}

interface EvidencePattern {
  mechanic: SpecificMechanic;
  polarity: EvidencePolarity;
  pattern: RegExp;
}

const EVIDENCE_PATTERNS: EvidencePattern[] = [
  {
    mechanic: "CONTROL_IMMUNITY",
    polarity: "PROTECTED",
    pattern: /\b(?:control immunity|immune to (?:all )?(?:crowd control|control effects?))\b/gi,
  },
  {
    mechanic: "CC_REMOVAL",
    polarity: "REMOVED",
    pattern: /\b(?:removes?|purges?|cleanses?)\s+(?:(?:all|any)\s+)?(?:crowd control|control effects?|cc effects?)\b/gi,
  },
  {
    mechanic: "REMOVE_SLOW",
    polarity: "REMOVED",
    pattern: /\b(?:removes?|purges?|cleanses?)\s+(?:(?:all|any)\s+)?slow effects?\b/gi,
  },
  {
    mechanic: "APPLY_STUN",
    polarity: "APPLIED",
    pattern: /\b(?:stuns?|stunning)\b/gi,
  },
  {
    mechanic: "APPLY_IMMOBILIZE",
    polarity: "APPLIED",
    pattern: /\b(?:immobilizes?|immobilizing)\s+(?:(?:the|all|nearby)\s+)?(?:target|enemy|enemies|heroes|hero)\b/gi,
  },
  {
    mechanic: "APPLY_AIRBORNE",
    polarity: "APPLIED",
    pattern: /\b(?:airborne|knocks?\s+(?:the\s+)?(?:target|enemy|enemies)\s+up)\b/gi,
  },
  {
    mechanic: "APPLY_KNOCKBACK",
    polarity: "APPLIED",
    pattern: /\bknock(?:s|ed|ing)?\s+back\b/gi,
  },
  {
    mechanic: "APPLY_SLOW",
    polarity: "APPLIED",
    pattern: /\b(?:slows?|slowed|slowing)\b/gi,
  },
  {
    mechanic: "UNTARGETABLE",
    polarity: "PROTECTED",
    pattern: /\b(?:untargetable|cannot be targeted|can't be targeted)\b/gi,
  },
  {
    mechanic: "INVULNERABLE",
    polarity: "PROTECTED",
    pattern: /\b(?:invulnerable|invulnerability)\b/gi,
  },
  {
    mechanic: "DASH",
    polarity: "APPLIED",
    pattern: /\b(?:dashes?|dashing|dash)\b/gi,
  },
  {
    mechanic: "BLINK",
    polarity: "APPLIED",
    pattern: /\b(?:blinks?|blinking|blink)\b/gi,
  },
  {
    mechanic: "SHIELD",
    polarity: "PROTECTED",
    pattern: /\b(?:shield|shields|shielded|gains? a shield|grants? a shield)\b/gi,
  },
  {
    mechanic: "DAMAGE_REDUCTION",
    polarity: "PROTECTED",
    pattern: /\b(?:damage reduction|reduces? (?:the )?damage (?:taken|received)|damage taken is reduced)\b/gi,
  },
  {
    mechanic: "HEALING",
    polarity: "APPLIED",
    pattern: /\b(?:heals?|healing|recovers? hp|recovers? health|restores? hp|restores? health|hp regeneration)\b/gi,
  },
  {
    mechanic: "PHYSICAL_DAMAGE",
    polarity: "APPLIED",
    pattern: /\bphysical damage\b/gi,
  },
  {
    mechanic: "MAGIC_DAMAGE",
    polarity: "APPLIED",
    pattern: /\bmagic damage\b/gi,
  },
  {
    mechanic: "TRUE_DAMAGE",
    polarity: "APPLIED",
    pattern: /\btrue damage\b/gi,
  },
];

function cleanDescription(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isNegated(
  text: string,
  start: number,
  mechanic: SpecificMechanic,
): boolean {
  const context = text.slice(Math.max(0, start - 65), start).toLowerCase();

  if (
    mechanic === "APPLY_STUN" &&
    /(?:immune|immunity|resistant)\s+to\s+(?:being\s+)?$/.test(context)
  ) {
    return true;
  }

  if (
    mechanic === "APPLY_SLOW" &&
    /(?:remove|removes|purge|purges|cleanse|cleanses)\s+(?:all\s+)?$/.test(context)
  ) {
    return true;
  }

  return false;
}

export function extractMechanicEvidence(
  description: string,
): MechanicEvidence[] {
  const text = cleanDescription(description);
  const evidence: MechanicEvidence[] = [];

  if (!text) return evidence;

  for (const item of EVIDENCE_PATTERNS) {
    const pattern = new RegExp(item.pattern.source, item.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (isNegated(text, match.index, item.mechanic)) {
        continue;
      }

      evidence.push({
        mechanic: item.mechanic,
        polarity: item.polarity,
        evidenceText: match[0],
        start: match.index,
        end: match.index + match[0].length,
        verificationStatus: "UNVERIFIED",
      });

      if (match[0].length === 0) {
        pattern.lastIndex++;
      }
    }
  }

  return evidence.sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );
}

export function extractSkillMechanicEvidence(
  record: ExtractedMechanicRecord,
): SkillMechanicEvidence {
  return {
    heroName: record.heroName,
    skillName: record.skillName,
    apiSkillId: record.apiSkillId,
    apiGroupId: record.apiGroupId,
    sourceDataset: record.sourceDataset,
    evidence: extractMechanicEvidence(record.description),
    verificationStatus: "UNVERIFIED",
  };
}

export function extractMechanicsFromRecords(
  records: ExtractedMechanicRecord[],
): SkillMechanicEvidence[] {
  return records.map(extractSkillMechanicEvidence);
}