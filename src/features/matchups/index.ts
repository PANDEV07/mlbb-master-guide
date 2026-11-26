export const MATCHUP_PHASES = [
  "Early Game (Level 1–4 & Laning)",
  "Mid Game (Power Spike & Rotasi Objektif)",
  "Late Game (Teamfight & Scaling)",
] as const;

export { MatchupAnalyzerClient } from "./MatchupAnalyzerClient";

export * from "./engine/mechanic-extractor";
export * from "./engine/interaction-rules";
export * from "./engine/matchup-aggregator";
export * from "./engine/matchup-intelligence";
export * from "./engine/mechanic-evidence-extractor";
export * from "./engine/evidence-interaction-engine";
export * from "./engine/evidence-review-queue";
export * from "./engine/evidence-review-workflow";
export * from "./engine/evidence-review-workspace";
