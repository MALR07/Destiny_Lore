export interface Cinematic {
  id: number;
  title: string;
  youtubeUrl: string;
  sourceUrl: string;
}

export interface LoreEntry {
  id: string;
  sourceGame: "destiny1" | "destiny2";
  sourceUrl: string | null;
  imageUrl: string | null;
  imageKind: "icon" | "artwork" | null;
  title: string;
  titleEn: string;
  subtitle: string | null;
  contentEs: string | null;
  contentEn: string;
  cinematics: Cinematic[];
}

export interface LorePage {
  items: LoreEntry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type LoreGroupType = "book" | "release";

export interface LoreGroup {
  id: string;
  groupType: LoreGroupType;
  sourceGame: "destiny1" | "destiny2" | "all";
  title: string;
  titleEn: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  releaseNumber: number | null;
  releaseOrder: number | null;
  releaseSlug: string | null;
  releaseTitle: string | null;
  releaseImageUrl: string | null;
  releaseImageKind?: "icon" | "artwork" | null;
  lorePreview: Array<{ id: string; title: string }>;
  entryCount: number;
  localEntryCount: number;
  catalogItemCount: number;
}

export type CatalogCategory = "all" | "weapons" | "armor" | "characters" | "places" | "species" | "factions" | "objects";

export interface CatalogEntry {
  id: string;
  sourceGame: "destiny1" | "destiny2";
  category: Exclude<CatalogCategory, "all">;
  title: string;
  titleEn: string;
  summaryEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  flavorTextEn: string | null;
  flavorTextEs: string | null;
  imageUrl: string | null;
  imageKind: "icon" | "artwork" | null;
  rarity: string | null;
  classType: number | null;
  itemType: string | null;
  iconUrl: string | null;
  sourceUrl: string | null;
}

export interface CatalogPage {
  items: CatalogEntry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface LoreReference {
  id: string;
  kind: "lore" | "catalog";
  sourceGame: "destiny1" | "destiny2";
  category: CatalogEntry["category"] | null;
  title: string;
  titleEn: string;
  imageUrl: string | null;
  imageKind: "icon" | "artwork" | null;
  sourceUrl: string | null;
  matchedName: string;
}
