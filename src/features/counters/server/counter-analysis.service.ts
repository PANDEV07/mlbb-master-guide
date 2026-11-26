import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  extractMechanicEvidence,
  type SkillMechanicEvidence,
} from "../../matchups/engine/mechanic-evidence-extractor";

import {
  analyzeCounterAgainstHero,
} from "../engine/counter-engine";

interface RawSkill {
  apiSkillId?: string | number;
  apiGroupId?: string | number;
  name: string;
  description?: string;
}

interface RawSkillGroup {
  apiGroupId: string | number;
  skills: RawSkill[];
}

interface RawHero {
  heroName: string;
  skillGroups: RawSkillGroup[];
}

interface CandidateDataset {
  heroes: RawHero[];
}

function loadCandidateDataset(): RawHero[] {
  const filePath = resolve(process.cwd(), "hero-gameplay-normalized.json");
  const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error("Format hero-gameplay-normalized.json bukan array.");
  }

  return parsed as RawHero[];
}

function buildEvidenceRecords(heroes: RawHero[]): SkillMechanicEvidence[] {
  return heroes.flatMap((hero) =>
    hero.skillGroups.flatMap((group) =>
      group.skills.map((skill) => ({
        heroName: hero.heroName,
        skillName: skill.name,
        apiSkillId: skill.apiSkillId ?? null,
        apiGroupId: skill.apiGroupId ?? group.apiGroupId,
        sourceDataset: "hero-gameplay-normalized.json" as const,
        evidence: extractMechanicEvidence(skill.description ?? ""),
        verificationStatus: "UNVERIFIED" as const,
      })),
    ),
  );
}

export function analyzeCounterFromCandidateDataset(targetHero: string) {
  const heroes = loadCandidateDataset();
  const evidenceRecords = buildEvidenceRecords(heroes);
  const analysis = analyzeCounterAgainstHero(targetHero, evidenceRecords);

  return {
    metadata: {
      source: "hero-gameplay-normalized.json",
      heroCount: heroes.length,
      skillRecordCount: evidenceRecords.length,
      evidenceRecordCount: evidenceRecords.filter(
        (record) => record.evidence.length > 0,
      ).length,
      verificationStatus: "UNVERIFIED" as const,
    },
    analysis,
  };
}