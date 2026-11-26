import type { PlatformModuleSpec } from "@/types/knowledge";

export const PLATFORM_MODULES: PlatformModuleSpec[] = [
  {
    id: "heroes",
    slug: "/heroes",
    title: "Database Hero",
    shortTitle: "Hero",
    category: "core",
    description:
      "Ensiklopedia hero terstruktur beserta mekanika skill, combo, role, lane assignment, dan status perubahan patch.",
    plannedScope: [
      "Profil hero dengan pemisahan Original vs Advance Server",
      "Rincian mekanika skill, cooldown, dan skill combo",
      "Role utama, fleksibilitas lane, dan power spike",
    ],
    requiredEntities: ["heroes", "hero_skills", "hero_combos", "patch_versions"],
    phaseTarget: "Phase 2",
    currentState: "SKELETON_READY",
  },
  {
    id: "items",
    slug: "/items",
    title: "Database Item",
    shortTitle: "Item",
    category: "core",
    description:
      "Katalog peralatan tempur, analisis pasif unik, efisiensi atribut, serta konteks penggunaan situasional.",
    plannedScope: [
      "Kategori item Physical, Magic, Defense, Movement, Jungling/Roaming",
      "Interaksi unik antar pasif dan batas efek item",
      "Riwayat perubahan statistik antar patch",
    ],
    requiredEntities: ["items", "patch_versions", "sources"],
    phaseTarget: "Phase 2",
    currentState: "SKELETON_READY",
  },
  {
    id: "builds",
    slug: "/builds",
    title: "Panduan Build & Rekomendasi Situasional",
    shortTitle: "Build",
    category: "tactical",
    description:
      "Penyusunan core build, emblem, battle spell, serta percabangan item situasional berdasarkan kondisi lawan.",
    plannedScope: [
      "Core item vs slot fleksibel berbasis kondisi match",
      "Sinergi emblem, talent, dan battle spell",
      "Alasan keputusan di balik setiap opsi item",
    ],
    requiredEntities: ["builds", "heroes", "items", "emblems", "battle_spells"],
    phaseTarget: "Phase 3",
    currentState: "SKELETON_READY",
  },
  {
    id: "matchups",
    slug: "/matchups",
    title: "Intelijen Matchup",
    shortTitle: "Matchup",
    category: "tactical",
    description:
      "Analisis pertarungan lane dan duel antar-hero berdasarkan fase Early, Mid, dan Late Game.",
    plannedScope: [
      "Keunggulan laning 1v1 dan 2v2 di tiap lane",
      "Jendela power spike level dan item kunci",
      "Kondisi menang dan cara bermain saat tertinggal",
    ],
    requiredEntities: ["hero_matchups", "heroes", "patch_versions"],
    phaseTarget: "Phase 3",
    currentState: "SKELETON_READY",
  },
  {
    id: "counters",
    slug: "/counters",
    title: "Sistem Counter & Sinergi",
    shortTitle: "Counter",
    category: "tactical",
    description:
      "Pemetaan hero counter, item counter, dan sinergi komposisi tim dengan alasan mekanis yang dapat diverifikasi.",
    plannedScope: [
      "Hero counter berbasis mekanik skill (anti-dash, anti-heal, suppress)",
      "Rekomendasi item counter terhadap ancaman spesifik",
      "Sinergi kombo tim dan keseimbangan draft",
    ],
    requiredEntities: ["hero_counters", "item_counters", "hero_synergies"],
    phaseTarget: "Phase 3",
    currentState: "SKELETON_READY",
  },
  {
    id: "academy",
    slug: "/academy",
    title: "Akademi Ranked & Gameplay",
    shortTitle: "Academy",
    category: "tactical",
    description:
      "Kurikulum peningkatan peringkat yang memisahkan strategi Solo, Duo, Trio, dan 5-Man Squad beserta fondasi Macro & Micro.",
    plannedScope: [
      "Solo, Duo, Trio, dan 5-Man Rank Academy",
      "Macro Academy (rotasi, kontrol objektif, wave management)",
      "Adaptasi strategi Pro-to-Ranked dengan penilaian risiko koordinasi",
    ],
    requiredEntities: ["strategies", "competitive_insights", "verification_records"],
    phaseTarget: "Phase 5",
    currentState: "RESEARCH_IN_PROGRESS",
  },
  {
    id: "patches",
    slug: "/patches",
    title: "Pusat Patch & Meta",
    shortTitle: "Patch",
    category: "intelligence",
    description:
      "Pelacakan pembaruan game dengan pemisahan tegas antara Original Server, Advance Server, dan fitur eksperimental.",
    plannedScope: [
      "Log perubahan hero, item, battlefield, jungle, Turtle/Lord, emblem, dan spell",
      "Deteksi otomatis panduan dan counter yang berpotensi usang",
      "Antrean verifikasi ulang saat patch baru dirilis",
    ],
    requiredEntities: ["patch_versions", "patch_changes", "verification_records"],
    phaseTarget: "Phase 1–2",
    currentState: "RESEARCH_IN_PROGRESS",
  },
  {
    id: "search",
    slug: "/search",
    title: "Pencarian Pengetahuan Terpadu",
    shortTitle: "Cari",
    category: "core",
    description:
      "Mesin penemuan lintas entitas untuk menelusuri hero, item, matchup, strategi ranked, turnamen, dan catatan patch.",
    plannedScope: [
      "Pencarian lintas domain dengan filter jenis entitas",
      "Filter status verifikasi dan relevansi patch",
      "Akses cepat ke rujukan sumber tiap entitas",
    ],
    requiredEntities: ["all_indexed_entities"],
    phaseTarget: "Phase 6",
    currentState: "SKELETON_READY",
  },
];
