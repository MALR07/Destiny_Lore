import type {
  CatalogCategory,
  CatalogEntry,
  CatalogPage,
  LoreEntry,
  LoreGroup,
  LoreGroupType,
  LorePage,
  LoreReference,
} from "../types/lore";

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Error de servidor (${response.status})`);
  }
  return body;
}

export async function getLore(
  search: string,
  page: number,
  withVideos: boolean,
  game: "all" | "destiny1" | "destiny2",
  signal?: AbortSignal,
  groupId?: string | null,
): Promise<LorePage> {
  const params = new URLSearchParams({
    q: search,
    page: String(page),
    videos: String(withVideos),
    game,
  });
  if (groupId) params.set("group", groupId);
  const response = await fetch(`/api/lore?${params}`, { signal });
  return readJson<LorePage>(response);
}

export async function getLoreGroups(
  type: LoreGroupType,
  search: string,
  signal?: AbortSignal,
): Promise<LoreGroup[]> {
  const params = new URLSearchParams({ type, q: search });
  const response = await fetch(`/api/lore-groups?${params}`, { signal });
  const body = await readJson<{ items: LoreGroup[] }>(response);
  return body.items;
}

export async function getCatalog(
  search: string,
  page: number,
  game: "all" | "destiny1" | "destiny2",
  category: CatalogCategory,
  signal?: AbortSignal,
  filters?: { releaseSlug?: string; rarity?: string; classType?: number | null },
): Promise<CatalogPage> {
  const params = new URLSearchParams({
    q: search,
    page: String(page),
    game,
    category,
  });
  if (filters?.releaseSlug) params.set("release", filters.releaseSlug);
  if (filters?.rarity) params.set("rarity", filters.rarity);
  if (filters?.classType != null) params.set("classType", String(filters.classType));
  const response = await fetch(`/api/catalog?${params}`, { signal });
  return readJson<CatalogPage>(response);
}

export async function getLoreReferences(
  loreId: string,
  signal?: AbortSignal,
): Promise<LoreReference[]> {
  const response = await fetch(`/api/lore-references?id=${encodeURIComponent(loreId)}`, { signal });
  const body = await readJson<{ items: LoreReference[] }>(response);
  return body.items;
}

export async function getLoreEntryById(id: string): Promise<LoreEntry> {
  const params = new URLSearchParams({ id, page: "1", videos: "false", game: "all" });
  const response = await fetch(`/api/lore?${params}`);
  const body = await readJson<LorePage>(response);
  const entry = body.items[0];
  if (!entry) throw new Error("No se encontró el relato enlazado.");
  return entry;
}

export async function getCatalogEntryById(id: string): Promise<CatalogEntry> {
  const params = new URLSearchParams({ id, page: "1", category: "all", game: "all" });
  const response = await fetch(`/api/catalog?${params}`);
  const body = await readJson<CatalogPage>(response);
  const entry = body.items[0];
  if (!entry) throw new Error("No se encontró la ficha enlazada.");
  return entry;
}

export async function translateLore(
  id: string,
): Promise<{ titleEs: string; contentEs: string }> {
  const response = await fetch("/api/translate-lore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return readJson<{ titleEs: string; contentEs: string }>(response);
}
