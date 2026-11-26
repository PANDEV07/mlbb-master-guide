export * from "./types/patch-hub.types";
export * from "./utils/patch-health";

export const SERVER_TRACK_CATEGORIES = [
  {
    id: "ORIGINAL_SERVER",
    title: "Original Server",
    description:
      "Server resmi aktif yang menjadi acuan utama panduan ranked dan turnamen.",
  },
  {
    id: "ADVANCE_SERVER",
    title: "Advance Server",
    description:
      "Lingkungan uji coba pra-rilis; perubahan di sini belum tentu masuk ke Original Server.",
  },
  {
    id: "EXPERIMENTAL",
    title: "Fitur Eksperimental & Rumor",
    description:
      "Konsep atau roadmap awal yang belum terverifikasi untuk rilis live.",
  },
] as const;
