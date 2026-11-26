import { writeFileSync } from "node:fs";

async function main() {
  const uri = "https://api.gms.moontontech.com/api/gms/source/2669606/2756564";

  const body = {
    pageSize: 200,
    pageIndex: 1,
    filters: [],
    sorts: [{ field: "hero_id", order: "desc" }],
    fields: [],
    object: [],
  };

  const response = await fetch(uri, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Moonton API error: ${response.status}`);
  }

  const result = await response.json();
  const records = result?.data?.records ?? [];

  const audit = records.map((record: any) => {
    const hero = record?.data?.hero?.data ?? {};
    const groups = Array.isArray(hero.heroskilllist)
      ? hero.heroskilllist
      : [];

    const skills = groups.flatMap((group: any) => {
      const entries = Array.isArray(group?.skilllist)
        ? group.skilllist
        : [];

      return entries.map((skill: any) => ({
        groupId: group.skilllistid ?? null,
        skillId: skill.skillid ?? null,
        name: skill.skillname ?? null,
        descriptionPresent: Boolean(skill.skilldesc),
        description: skill.skilldesc ?? null,
        iconUrl: skill.skillicon ?? null,
        videoUrl: skill.skillvideo ?? null,
        tags: skill.skilltag ?? null,
        cooldownCost: skill["skillcd&cost"] ?? null,
        iconPresent: Boolean(skill.skillicon),
        videoPresent: Boolean(skill.skillvideo),
      }));
    });

    return {
      name: hero.name ?? record?.name ?? "UNKNOWN",
      heroId: hero.heroid ?? record?.hero_id ?? null,
      roleSource: hero.sortlabel ?? null,
      laneSource: hero.roadsortlabel ?? null,
      specialtySource: hero.speciality ?? null,
      difficultySource: hero.difficulty ?? null,
      skillGroupCount: groups.length,
      skillCount: skills.length,
      skills,
    };
  });

  const summary = {
    fetchedHeroCount: records.length,
    heroWithSkills: audit.filter((h: any) => h.skillCount > 0).length,
    heroWithoutSkills: audit.filter((h: any) => h.skillCount === 0).length,
    totalSkills: audit.reduce((sum: number, h: any) => sum + h.skillCount, 0),
    skillsWithIcons: audit.reduce(
      (sum: number, h: any) => sum + h.skills.filter((s: any) => s.iconPresent).length, 0
    ),
    skillsWithVideos: audit.reduce(
      (sum: number, h: any) => sum + h.skills.filter((s: any) => s.videoPresent).length, 0
    ),
    sampleHeroes: audit.slice(0, 5),
  };

  writeFileSync(
    "hero-gameplay-api-audit.json",
    JSON.stringify(audit, null, 2),
    "utf8"
  );

  console.log(JSON.stringify(summary, null, 2));
  console.log("\nAudit file: hero-gameplay-api-audit.json");
}

main().catch((error) => {
  console.error("AUDIT FAILED:", error);
  process.exitCode = 1;
});


