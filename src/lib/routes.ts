import type { CatalogCategory, LoreGroup } from "../types/lore";

export type ArchiveMode =
  | "home"
  | "game"
  | "destinations"
  | "raids"
  | "raid-detail"
  | "lore"
  | "books"
  | "releases"
  | "timeline"
  | "catalog";

export interface ArchiveRoute {
  mode: ArchiveMode;
  game: "all" | "destiny1" | "destiny2";
  groupSlug?: string;
  grimoirePageSlug?: string;
  raidId?: string;
  detailKind?: "lore" | "catalog";
  detailId?: string;
  catalogCategory?: CatalogCategory;
}

export function routeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseArchiveRoute(pathname: string): ArchiveRoute {
  const parts = pathname.split("/").filter(Boolean);
  const game = (value?: string): ArchiveRoute["game"] =>
    value === "destiny" || value === "destiny1" ? "destiny1" : value === "destiny2" ? "destiny2" : "all";

  if (parts.length === 0) return { mode: "home", game: "all" };
  if (parts[0] === "destiny" || parts[0] === "destiny2") {
    const selectedGame = game(parts[0]);
    const page = parts[1];
    if (!page) return { mode: "game", game: selectedGame };
    if (page === "mapa-estelar") {
      return { mode: "destinations", game: selectedGame };
    }
    if (page === "raids") {
      return parts[2]
        ? { mode: "raid-detail", game: selectedGame, raidId: parts[2] }
        : { mode: "raids", game: selectedGame };
    }
    if (page === "grimorio" || page === "relatos") {
      if (parts[2] === "carta" && parts[3]) {
        return { mode: "lore", game: selectedGame, detailKind: "lore", detailId: parts[3] };
      }
      return parts[2] === "seccion" && parts[3]
        ? { mode: "lore", game: selectedGame, grimoirePageSlug: parts[3] }
        : { mode: "lore", game: selectedGame };
    }
    if (page === "lanzamientos") {
      return { mode: "releases", game: selectedGame, groupSlug: parts[2] };
    }
    if (page === "libros") {
      return { mode: "books", game: selectedGame, groupSlug: parts[2] };
    }
  }
  if (parts[0] === "cronicas") {
    if (parts[1] === "libros") {
      return parts[2] && parts[3]
        ? { mode: "books", game: game(parts[2]), groupSlug: parts[3] }
        : parts[2]
          ? { mode: "books", game: "all", groupSlug: parts[2] }
          : { mode: "books", game: "all" };
    }
    if (parts[1] === "lanzamientos") {
      return parts[2] && parts[3]
        ? { mode: "releases", game: game(parts[2]), groupSlug: parts[3] }
        : parts[2]
          ? { mode: "releases", game: "all", groupSlug: parts[2] }
          : { mode: "releases", game: "all" };
    }
    if (parts[1] === "recorrido") return { mode: "timeline", game: "all" };
  }
  if (parts[0] === "universo") {
    const selectedGame = game(parts[1]);
    const category = parts[2] as CatalogCategory | undefined;
    const allowedCategories: CatalogCategory[] = ["all", "weapons", "armor", "characters", "places", "species", "factions", "objects"];
    const catalogCategory = category && allowedCategories.includes(category) ? category : "all";
    return parts[3]
      ? { mode: "catalog", game: selectedGame, catalogCategory, detailKind: "catalog", detailId: parts[3] }
      : { mode: "catalog", game: selectedGame, catalogCategory };
  }
  return { mode: "home", game: "all" };
}

export function pathForGroup(group: { groupType: string; sourceGame: string; releaseSlug: string | null; title: string; titleEn: string }): string {
  const slug = group.groupType === "release"
    ? group.releaseSlug ?? routeSlug(group.titleEn || group.title)
    : routeSlug(group.titleEn || group.title);
  const game = group.sourceGame === "destiny1" ? "destiny" : group.sourceGame === "destiny2" ? "destiny2" : null;
  if (group.groupType === "book") {
    return game ? `/${game}/libros/${slug}` : `/cronicas/libros/${slug}`;
  }
  return game ? `/${game}/lanzamientos/${slug}` : `/cronicas/lanzamientos/${slug}`;
}

export function pathForGame(game: "destiny1" | "destiny2"): string {
  return game === "destiny1" ? "/destiny" : "/destiny2";
}

export function pathForGrimoirePage(group: Pick<LoreGroup, "id" | "bungieId" | "title" | "titleEn">): string {
  const stableId = group.bungieId?.startsWith("d1-page:")
    ? group.bungieId.slice("d1-page:".length).replace(/:/g, "-")
    : group.bungieId || group.id;
  const slug = [routeSlug(group.titleEn || group.title), stableId.replace(/[^a-z0-9-]+/giu, "-")]
    .filter(Boolean)
    .join("-");
  return `/destiny/grimorio/seccion/${slug}`;
}

export function pathForCatalog(game: ArchiveRoute["game"], category: CatalogCategory = "all"): string {
  const gamePath = game === "destiny1" ? "destiny" : game === "destiny2" ? "destiny2" : "all";
  return `/universo/${gamePath}/${category}`;
}

export function metadataForRoute(route: ArchiveRoute, groupTitle?: string, entryTitle?: string): { title: string; description: string } {
  if (entryTitle) return { title: `${entryTitle} — Archivo del Viajero`, description: `Descubre ${entryTitle} en el archivo de Destiny, con información y contexto en español.` };
  if (groupTitle) return { title: `${groupTitle} — Archivo del Viajero`, description: `Explora los relatos, el equipo y la historia de ${groupTitle} en Destiny.` };
  const gameName = route.game === "destiny1" ? "Destiny" : route.game === "destiny2" ? "Destiny 2" : "Destiny";
  const content: Record<ArchiveMode, { title: string; description: string }> = {
    home: { title: "Archivo del Viajero — Lore de Destiny", description: "Explora el universo de Destiny: relatos, personajes, mapas, incursiones y lanzamientos en español." },
    game: { title: `${gameName} — Archivo del Viajero`, description: `Explora el archivo de ${gameName}: relatos, destinos, incursiones y lanzamientos.` },
    destinations: { title: `Mapa estelar de ${gameName} — Archivo del Viajero`, description: `Recorre los destinos y lugares de ${gameName} en el mapa estelar.` },
    raids: { title: `Incursiones de ${gameName} — Archivo del Viajero`, description: `Guías, botín y relatos de las incursiones de ${gameName}.` },
    "raid-detail": { title: `Incursión de ${gameName} — Archivo del Viajero`, description: `Guía, encuentros y botín de esta incursión de ${gameName}.` },
    lore: { title: `Grimorio de ${gameName} — Archivo del Viajero`, description: `Lee y busca relatos del universo de ${gameName} en español.` },
    books: { title: "Libros de Destiny — Archivo del Viajero", description: "Explora los libros y relatos organizados por juego y lanzamiento." },
    releases: { title: "Lanzamientos de Destiny — Archivo del Viajero", description: "Consulta expansiones, temporadas y episodios de Destiny y Destiny 2." },
    timeline: { title: "Cronología de Destiny — Archivo del Viajero", description: "Sigue el recorrido de Destiny a través de sus expansiones y eras." },
    catalog: { title: "Archivo del universo de Destiny — Archivo del Viajero", description: "Busca armas, armaduras y objetos del universo de Destiny." },
  };
  return content[route.mode];
}
