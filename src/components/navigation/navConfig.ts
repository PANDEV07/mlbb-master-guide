export interface NavItemConfig {
  label: string;
  href: string;
  iconName:
    | "compass"
    | "shield"
    | "package"
    | "layers"
    | "swords"
    | "git-compare"
    | "trophy"
    | "graduation-cap"
    | "history"
    | "search";
  group: "utama" | "ensiklopedia" | "strategi" | "intelijen";
}

export const NAV_GROUPS: Array<{
  id: NavItemConfig["group"];
  label: string;
}> = [
  { id: "utama", label: "Ringkasan" },
  { id: "ensiklopedia", label: "Ensiklopedia Inti" },
  { id: "strategi", label: "Taktik & Akademi" },
  { id: "intelijen", label: "Intelijen Meta & Pro" },
];

export const NAV_ITEMS: NavItemConfig[] = [
  { label: "Beranda", href: "/", iconName: "compass", group: "utama" },
  { label: "Pencarian", href: "/search", iconName: "search", group: "utama" },
  { label: "Hero", href: "/heroes", iconName: "shield", group: "ensiklopedia" },
  { label: "Item", href: "/items", iconName: "package", group: "ensiklopedia" },
  { label: "Build", href: "/builds", iconName: "layers", group: "strategi" },
  { label: "Matchup", href: "/matchups", iconName: "swords", group: "strategi" },
  { label: "Counter", href: "/counters", iconName: "git-compare", group: "strategi" },
  { label: "Akademi", href: "/academy", iconName: "graduation-cap", group: "strategi" },
  { label: "Patch", href: "/patches", iconName: "history", group: "intelijen" },
];
