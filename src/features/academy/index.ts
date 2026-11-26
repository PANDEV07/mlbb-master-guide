export * from "./types/academy.types";
export * from "./data/ranked-contexts";
export * from "./data/pro-to-ranked-studies";
export * from "./utils/academy-guards";

export const ACADEMY_TRACKS = [
  {
    id: "solo",
    title: "Solo Rank Academy",
    coordination: "Tanpa Komunikasi Suara Terjamin",
    focus:
      "Kemampuan membawa dampak mandiri, pembacaan minimap independen, dan manajemen risiko.",
  },
  {
    id: "duo",
    title: "Duo Rank Academy",
    coordination: "Koordinasi 2 Pemain",
    focus:
      "Sinergi pasangan kunci (Jungle–Roam, Mid–Roam, atau Gold–Roam) untuk kontrol tempo.",
  },
  {
    id: "trio",
    title: "Trio Rank Academy",
    coordination: "Inti Rotasi 3 Pemain",
    focus:
      "Penguasaan mid-triangle, setup objektif Turtle/Lord, dan invasi terukur.",
  },
  {
    id: "five-man",
    title: "5-Man Squad Academy",
    coordination: "Koordinasi Penuh 5 Pemain",
    focus:
      "Draft terstruktur, strategi lane swap, rotasi sinkron, dan adaptasi taktik turnamen.",
  },
] as const;
