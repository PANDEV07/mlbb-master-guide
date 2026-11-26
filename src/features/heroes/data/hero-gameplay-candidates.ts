import candidateData from "../../../../hero-gameplay-normalized.json";

export function getHeroGameplayCandidate(heroName: string) {
  return candidateData.find(
    (hero) => hero.heroName.trim().toLowerCase() === heroName.trim().toLowerCase()
  ) ?? null;
}

export function cleanCandidateDescription(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .trim();
}