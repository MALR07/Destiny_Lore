import { lazy, Suspense, useEffect, useState } from "react";
import LoreCard from "./components/LoreCard";
import LoreGroupIndex from "./components/LoreGroupIndex";
import CatalogCard from "./components/CatalogCard";
import EquipmentTile from "./components/EquipmentTile";
import ApiLoading from "./components/ApiLoading";
import { raids } from "./data/raids";
import { getCatalog, getCatalogEntryById, getLore, getLoreEntryById, getLoreGroups } from "./lib/api";
import { metadataForRoute, parseArchiveRoute, pathForCatalog, pathForGame, pathForGrimoirePage, pathForGroup, routeSlug } from "./lib/routes";
import type {
  CatalogCategory,
  CatalogEntry,
  CatalogPage,
  LoreEntry,
  LoreGroup,
  LoreGroupType,
  LorePage,
  LoreReference,
} from "./types/lore";

const PAGE_SIZE = 24;
const LoreReader = lazy(() => import("./components/LoreReader"));
const D1GrimoireArchive = lazy(() => import("./components/D1GrimoireArchive"));
const BookContext = lazy(() => import("./components/BookContext"));
const ReleaseArchiveDetail = lazy(() => import("./components/ReleaseArchiveDetail"));
const TimelineArchive = lazy(() => import("./components/TimelineArchive"));
const CatalogReader = lazy(() => import("./components/CatalogReader"));
const SiteHeader = lazy(() => import("./components/SiteHeader"));
const ArchiveLanding = lazy(() => import("./components/ArchiveLanding"));
const GamePortal = lazy(() => import("./components/GamePortal"));
const StellarMap = lazy(() => import("./components/StellarMap"));
const RaidArchive = lazy(() => import("./components/RaidArchive"));
const RaidDetail = lazy(() => import("./components/RaidDetail"));

export default function App() {
  const initialRoute = parseArchiveRoute(window.location.pathname);
  const [routePath, setRoutePath] = useState(window.location.pathname);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [game, setGame] = useState<"all" | "destiny1" | "destiny2">(initialRoute.game);
  const [archiveMode, setArchiveMode] = useState<
    "home" | "game" | "destinations" | "raids" | "raid-detail" | "lore" | "books" | "releases" | "timeline" | "catalog"
  >(initialRoute.mode);
  const [returnMode, setReturnMode] = useState<"game" | "raids" | "timeline" | null>(null);
  const [groups, setGroups] = useState<LoreGroup[]>([]);
  const [selectedRaid, setSelectedRaid] = useState<string | null>(initialRoute.raidId ?? null);
  const [selectedGroup, setSelectedGroup] = useState<LoreGroup | null>(null);
  const [catalogCategory, setCatalogCategory] = useState<CatalogCategory>(initialRoute.catalogCategory ?? "all");
  const [catalogRarity, setCatalogRarity] = useState("");
  const catalogRarities = game === "destiny2"
    ? ["Excepcional", "Leyenda", "Peculiar", "Poco común", "Común"]
    : game === "destiny1"
      ? ["Excepcional", "Leyenda", "Peculiar", "Poco común", "Común"]
      : ["Excepcional", "Leyenda", "Peculiar", "Poco común", "Común"];
  const [catalogClassType, setCatalogClassType] = useState("all");
  const [selected, setSelected] = useState<LoreEntry | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogEntry | null>(null);
  const [result, setResult] = useState<LorePage | null>(null);
  const [catalogResult, setCatalogResult] = useState<CatalogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function navigatePath(path: string, returnPath = window.location.pathname) {
    if (path === window.location.pathname) return;
    window.history.pushState({ returnPath }, "", path);
    setRoutePath(path);
    setError(null);
  }

  function goBackOr(fallbackPath: string) {
    if (typeof window.history.state?.returnPath === "string") {
      window.history.back();
      return;
    }
    window.history.replaceState({}, "", fallbackPath);
    setRoutePath(fallbackPath);
    applyRoute(fallbackPath);
  }

  function openLore(entry: LoreEntry) {
    setSelected(entry);
    setSelectedCatalog(null);
    navigatePath(`/${entry.sourceGame === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}/carta/${entry.id}`);
  }

  function openCatalog(entry: CatalogEntry) {
    setSelectedCatalog(entry);
    setSelected(null);
    const path = pathForCatalog(entry.sourceGame, entry.category);
    navigatePath(`${path}/${entry.id}`);
  }

  function applyRoute(pathname: string) {
    const route = parseArchiveRoute(pathname);
    setArchiveMode(route.mode);
    setGame(route.game);
    setSelectedRaid(route.raidId ?? null);
    setSelectedGroup(null);
    setSelected(null);
    setSelectedCatalog(null);
    setCatalogCategory(route.catalogCategory ?? "all");
    setCatalogRarity("");
    setCatalogClassType("all");
    setSearch("");
    setSearchInput("");
    setPage(1);
    setReturnMode(null);
    setError(null);
  }

  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname);
      applyRoute(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const route = parseArchiveRoute(routePath);
    const metadata = metadataForRoute(
      route,
      selectedGroup?.title,
      selected?.title ?? selectedCatalog?.title,
    );
    document.title = metadata.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    description?.setAttribute("content", metadata.description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const canonicalPath = routePath.length > 1 ? routePath.replace(/\/+$/, "") : routePath;
    canonical.href = `${window.location.origin}${canonicalPath}`;
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    ogTitle?.setAttribute("content", metadata.title);
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    ogDescription?.setAttribute("content", metadata.description);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute("content", metadata.title);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute("content", metadata.description);
    let ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonical.href;
    const socialImage = `${window.location.origin}/media/site-art/portada/arte%20intro.jpg`;
    document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.setAttribute("content", socialImage);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.setAttribute("content", socialImage);
  }, [routePath, selectedGroup, selected, selectedCatalog]);

  useEffect(() => {
    const route = parseArchiveRoute(routePath);
    if (!route.detailId || !route.detailKind) return;
    if (route.detailKind === "lore" && selected?.id === route.detailId) return;
    if (route.detailKind === "catalog" && selectedCatalog?.id === route.detailId) return;
    let active = true;
    const load = route.detailKind === "lore"
      ? getLoreEntryById(route.detailId).then((entry) => { if (active) setSelected(entry); })
      : getCatalogEntryById(route.detailId).then((entry) => { if (active) setSelectedCatalog(entry); });
    load.catch((reason: unknown) => {
      if (!active) return;
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "No se pudo abrir el registro enlazado.");
    });
    return () => { active = false; };
  }, [routePath, selected, selectedCatalog]);

  function openLoreReference(reference: LoreReference) {
    setSelected(null);
    setSelectedCatalog(null);
    const path = reference.kind === "lore"
      ? `/${reference.sourceGame === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}/carta/${reference.id}`
      : `${pathForCatalog(reference.sourceGame, reference.category ?? "all")}/${reference.id}`;
    navigatePath(path);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    if (archiveMode === "lore" && game === "destiny1") {
      setLoading(false);
      return () => controller.abort();
    }
    if (archiveMode === "home" || archiveMode === "game" || archiveMode === "destinations" || archiveMode === "raid-detail"
      || (archiveMode === "releases" && selectedGroup)) {
      setLoading(false);
      return () => controller.abort();
    }
    const groupType: LoreGroupType | null = archiveMode === "books"
        ? "book"
        : archiveMode === "releases"
          ? "release"
          : null;
    const request = archiveMode === "timeline"
      ? Promise.all([
        getLoreGroups("release", search, controller.signal),
        getLoreGroups("book", search, controller.signal),
      ]).then(([releases, books]) => setGroups([...releases, ...books]))
      : archiveMode === "raids"
        ? getLoreGroups("release", search, controller.signal).then((data) => {
          setGroups(data.filter((group) => group.sourceGame === game));
        })
      : groupType && !selectedGroup
        ? getLoreGroups(groupType, search, controller.signal).then((data) => {
          const visibleGroups = archiveMode === "releases" && game !== "all"
            ? data.filter((group) => group.sourceGame === game)
            : data;
          setGroups(visibleGroups);
          const groupSlug = parseArchiveRoute(routePath).groupSlug;
          if (groupSlug) {
            const match = visibleGroups.find((group) =>
              (group.groupType === "release" ? group.releaseSlug ?? routeSlug(group.titleEn || group.title) : routeSlug(group.titleEn || group.title)) === groupSlug,
            );
            if (match) {
              setSelectedGroup(match);
            } else {
              setError("No se encontró el libro o lanzamiento solicitado.");
            }
          }
        })
        : archiveMode !== "catalog"
        ? getLore(
          search,
          page,
          false,
          groupType ? "all" : game,
          controller.signal,
          selectedGroup?.id,
        ).then((data) => {
        setResult(data);
      })
      : getCatalog(search, page, game, catalogCategory, controller.signal, {
        rarity: catalogRarity,
        classType: catalogClassType === "all" ? null : Number(catalogClassType),
      }).then((data) => {
        setCatalogResult(data);
      });
    request
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "No se pudo cargar el archivo.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, page, game, archiveMode, catalogCategory, catalogRarity, catalogClassType, selectedGroup, routePath]);

  async function openReleaseLore(id: string) {
    try {
      const entry = await getLoreEntryById(id);
      setSelectedCatalog(null);
      setSelected(entry);
      navigatePath(`/${entry.sourceGame === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}/carta/${id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo abrir el relato traducido.");
    }
  }

  const isGroupMode = ["books", "releases", "timeline"].includes(archiveMode);
  const isD1Grimoire = archiveMode === "lore" && game === "destiny1";
  const isD1GrimoireDetail = isD1Grimoire && Boolean(parseArchiveRoute(routePath).detailId);
  const activeTotal = archiveMode === "catalog"
      ? catalogResult?.total
      : archiveMode === "timeline"
        ? groups.filter((group) => group.groupType === "release").length
        : archiveMode === "raids"
          ? groups.length
        : isGroupMode && !selectedGroup
          ? groups.length
          : result?.total;
  const groupType: LoreGroupType | null = archiveMode === "books"
      ? "book"
      : archiveMode === "releases"
        ? "release"
        : null;
  const groupHeading = archiveMode === "books"
      ? "Libros"
      : archiveMode === "releases"
        ? "Lanzamientos"
        : archiveMode === "raids"
          ? "Raids"
        : archiveMode === "timeline"
          ? "Línea temporal"
        : null;
  function changeMode(mode: typeof archiveMode) {
    setPage(1);
    setSelectedGroup(null);
    setReturnMode(null);
    setArchiveMode(mode);
    const gamePath = game === "destiny1" ? "destiny" : "destiny2";
    const paths: Record<typeof archiveMode, string> = {
      home: "/",
      game: game === "destiny1" || game === "destiny2" ? `/${gamePath}` : "/",
      destinations: `/${gamePath}/mapa-estelar`,
      raids: `/${gamePath}/raids`,
      "raid-detail": `/${gamePath}/raids/${selectedRaid ?? ""}`,
      lore: `/${gamePath}/${game === "destiny1" ? "grimorio" : "relatos"}`,
      books: "/cronicas/libros",
      releases: "/cronicas/lanzamientos",
      timeline: "/cronicas/recorrido",
      catalog: "/universo/all/all",
    };
    navigatePath(paths[mode]);
  }
  function returnHome() {
    changeMode("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openGame(gameId: "destiny1" | "destiny2") {
    setGame(gameId);
    setSelectedGroup(null);
    setReturnMode(null);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setArchiveMode("game");
    navigatePath(pathForGame(gameId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openChronicles(section: "books" | "releases" | "timeline") {
    setGame("all");
    setSelectedGroup(null);
    setReturnMode(null);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setArchiveMode(section);
    navigatePath(section === "books" ? "/cronicas/libros" : section === "releases" ? "/cronicas/lanzamientos" : "/cronicas/recorrido");
    window.setTimeout(() => document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth" }), 0);
  }
  function openUniverse() {
    setGame("all");
    setCatalogCategory("all");
    setCatalogRarity("");
    setCatalogClassType("all");
    setSelectedGroup(null);
    setReturnMode(null);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setArchiveMode("catalog");
    navigatePath(pathForCatalog("all"));
    window.setTimeout(() => document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth" }), 0);
  }
  function openGameLore(gameId: "destiny1" | "destiny2") {
    setGame(gameId);
    setSelectedGroup(null);
    setReturnMode(null);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setArchiveMode("lore");
    navigatePath(`/${gameId === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}`);
    window.setTimeout(() => document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth" }), 0);
  }
  function openGameReleases(gameId: "destiny1" | "destiny2") {
    setGame(gameId);
    setSelectedGroup(null);
    setReturnMode(null);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setArchiveMode("releases");
    navigatePath(`/${gameId === "destiny1" ? "destiny" : "destiny2"}/lanzamientos`);
    window.setTimeout(() => document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth" }), 0);
  }
  function openGameRaids(gameId: "destiny1" | "destiny2") {
    setGame(gameId);
    setSelectedGroup(null);
    setReturnMode(null);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setArchiveMode("raids");
    navigatePath(`/${gameId === "destiny1" ? "destiny" : "destiny2"}/raids`);
    window.setTimeout(() => document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth" }), 0);
  }
  function openRaidDetail(raidId: string) {
    setSelectedRaid(raidId);
    setArchiveMode("raid-detail");
    const raid = raids.find((entry) => entry.id === raidId);
    if (raid) navigatePath(`/${raid.game === "destiny1" ? "destiny" : "destiny2"}/raids/${raid.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function backToRaids() {
    setSelectedRaid(null);
    setArchiveMode("raids");
    goBackOr(`/${game === "destiny1" ? "destiny" : "destiny2"}/raids`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openGroup(group: LoreGroup, returnTo: "game" | "raids" | "timeline" | null = null) {
    setPage(1);
    setSearch("");
    setSearchInput("");
    setReturnMode(returnTo);
    setSelectedGroup(group);
    setArchiveMode(group.groupType === "book" ? "books" : "releases");
    navigatePath(pathForGroup(group));
  }
  function openTimelineGroup(group: LoreGroup) {
    openGroup(group, "timeline");
  }
  function backFromGroup() {
    setSelectedGroup(null);
    if (returnMode) setArchiveMode(returnMode);
    setReturnMode(null);
    const fallback = returnMode === "timeline"
      ? "/cronicas/recorrido"
      : returnMode === "raids"
        ? `/${game === "destiny1" ? "destiny" : "destiny2"}/raids`
        : returnMode === "game"
          ? pathForGame(game === "destiny2" ? "destiny2" : "destiny1")
          : selectedGroup?.sourceGame === "destiny1"
            ? `/destiny/${selectedGroup.groupType === "book" ? "libros" : "lanzamientos"}`
            : selectedGroup?.sourceGame === "destiny2"
              ? `/destiny2/${selectedGroup.groupType === "book" ? "libros" : "lanzamientos"}`
              : selectedGroup?.groupType === "book" ? "/cronicas/libros" : "/cronicas/lanzamientos";
    goBackOr(fallback);
  }
  const activeRaid = raids.find((raid) => raid.id === selectedRaid);

  return (
    <Suspense fallback={<ApiLoading message="Cargando el archivo del Viajero…" />}>
      <>
      <SiteHeader
        onHome={returnHome}
        onCatalog={openUniverse}
        onChronicles={() => openChronicles("releases")}
      />
      <main>
        <section className="hero" id="sobre-el-archivo">
          <div className="hero-image">
            <img
              alt=""
              fetchPriority="high"
              src="/media/site-art/portada/arte%20intro.jpg"
            />
          </div>
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow"><i /> SEÑAL DEL VIAJERO · ARCHIVO DESPERTANDO</span>
            <h1>La historia<br />vuelve <em>a vivir.</em></h1>
            <p>
              Los guardianes forjan su destino.
            </p>
            <button className="hero-cta" onClick={() => document.getElementById("rutas")?.scrollIntoView({ behavior: "smooth" })} type="button">
              EXPLORAR EL ARCHIVO <span aria-hidden="true">↓</span>
            </button>
          </div>
          <span className="hero-art-credit">ARTE DE PORTADA · IMAGEN LOCAL</span>
        </section>

        {archiveMode === "home" && (
          <div id="rutas">
            <ArchiveLanding
              onOpenGame={openGame}
              onOpenChronicles={openChronicles}
              onOpenGrimoire={() => openGameLore("destiny1")}
              onOpenUniverse={openUniverse}
            />
          </div>
        )}

        {archiveMode === "game" && (game === "destiny1" || game === "destiny2") && (
          <GamePortal
            game={game}
            onBack={returnHome}
            onOpenLore={() => openGameLore(game)}
            onOpenMap={() => changeMode("destinations")}
            onOpenReleases={() => openGameReleases(game)}
            onOpenRaids={() => openGameRaids(game)}
            onOpenRelease={(group) => openGroup(group, "game")}
          />
        )}
        {archiveMode === "raids" && (game === "destiny1" || game === "destiny2") && (
          <section className="archive-section" id="archivo">
            <div className="archive-heading">
              <div>
                <span className="eyebrow">{game === "destiny1" ? "DESTINY · INCURSIONES" : "DESTINY 2 · INCURSIONES"}</span>
                <h2>Raids</h2>
              </div>
              <p>Incursiones de cada era, enlazadas con el archivo del lanzamiento al que pertenecen.</p>
            </div>
            <div className="archive-route-nav">
              <button className="archive-route-back" onClick={() => changeMode("game")} type="button">
                ← VOLVER A {game === "destiny1" ? "DESTINY" : "DESTINY 2"}
              </button>
              <span className="eyebrow">ÍNDICE DE INCURSIONES · {game === "destiny1" ? "DESTINY" : "DESTINY 2"}</span>
            </div>
            <div className="archive-toolbar">
              <label className="search-field">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <span className="visually-hidden">Buscar una incursión</span>
                <input
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar incursiones…"
                  type="search"
                  value={searchInput}
                />
                <span className="search-shortcut">⌕</span>
              </label>
            </div>
            {error ? (
              <div className="state-panel error-panel" role="alert">
                <strong>No se pudo cargar el índice de lanzamientos</strong>
                <p>{error}</p>
              </div>
            ) : loading ? (
              <ApiLoading message="Recuperando el archivo de incursiones…" />
            ) : (
              <RaidArchive
                game={game}
                onOpenRaid={openRaidDetail}
                search={search}
              />
            )}
          </section>
        )}

        {archiveMode === "raid-detail" && activeRaid && (
          <RaidDetail
            raid={activeRaid}
            onBack={backToRaids}
          />
        )}

        {archiveMode === "destinations" && (game === "destiny1" || game === "destiny2") && (
          <StellarMap
            game={game}
            onBack={() => changeMode("game")}
            onOpenLocation={openCatalog}
          />
        )}

        {!["home", "game", "destinations", "raids", "raid-detail"].includes(archiveMode) && <section className="archive-section" id="archivo">
          <div className="archive-heading">
            <div>
              <span className="eyebrow">
                {selectedGroup
                  ? selectedGroup.sourceGame === "destiny1"
                    ? archiveMode === "books" ? "DESTINY · ARCHIVO DEL LIBRO" : "DESTINY · ARCHIVO DEL LANZAMIENTO"
                    : selectedGroup.sourceGame === "destiny2"
                      ? archiveMode === "books" ? "DESTINY 2 · ARCHIVO DEL LIBRO" : "DESTINY 2 · ARCHIVO DEL LANZAMIENTO"
                      : "DESTINY 1 + 2 · ARCHIVO"
                  : archiveMode === "timeline"
                    ? "DESTINY 1 + 2 · RECORRIDO DEL GUARDIÁN"
                    : game === "destiny1"
                      ? "DESTINY · ARCHIVO"
                      : game === "destiny2"
                        ? "DESTINY 2 · ARCHIVO"
                        : "DESTINY 1 + 2 · ARCHIVO DEL UNIVERSO"}
              </span>
              <h2>
                {selectedGroup
                  ? selectedGroup.title
                  : archiveMode === "catalog"
                  ? "Índice del universo"
                  : isD1Grimoire
                    ? selected?.sourceGame === "destiny1" ? selected.title : "Grimorio"
                  : groupHeading ?? "Relatos recuperados"}
              </h2>
            </div>
            <p>
              {selectedGroup
                ? archiveMode === "releases"
                  ? "Items y relatos oficiales del lanzamiento, organizados como colecciones del juego."
                  : selectedGroup.localEntryCount > 0
                    ? `${selectedGroup.localEntryCount.toLocaleString("es-ES")} registros locales relacionados.`
                    : `${selectedGroup.entryCount.toLocaleString("es-ES")} referencias en la fuente; aún sin registros locales enlazados.`
                : archiveMode === "catalog"
                ? "Armas, armaduras, personajes y referencias localizados desde los manifiestos oficiales."
                : isD1Grimoire
                  ? "Cartas del Grimorio, organizadas por las seis categorías y las secciones oficiales del manifiesto de Destiny 1."
                : archiveMode === "books"
                    ? "Libros de Bungie agrupados por lanzamiento; su clasificación editorial no sustituye el texto oficial."
                      : archiveMode === "releases"
                      ? "Lanzamientos vinculados a los manifiestos oficiales de Bungie, del más reciente al más antiguo."
                        : archiveMode === "timeline"
                          ? "Sigue el recorrido de Destiny junto a los relatos oficiales, los libros y la historia completa del Destiny original en vídeo."
                        : "Fragmentos de historia, preservados para la próxima generación de Guardianes."}
            </p>
          </div>

          {archiveMode === "catalog" && (
            <div className="archive-route-nav">
              <button className="archive-route-back" onClick={returnHome} type="button">
                ← VOLVER A LAS RUTAS
              </button>
              <span className="eyebrow">ARCHIVO DEL UNIVERSO · D1 + D2</span>
            </div>
          )}
          {archiveMode === "lore" && (
            <div className="archive-route-nav">
              <button
                className="archive-route-back"
                onClick={() => isD1GrimoireDetail ? goBackOr("/destiny/grimorio") : changeMode("game")}
                type="button"
              >
                ← VOLVER A {isD1GrimoireDetail ? "GRIMORIO" : game === "destiny1" ? "DESTINY" : game === "destiny2" ? "DESTINY 2" : "LAS RUTAS"}
              </button>
              <span className="eyebrow">{game === "destiny1" ? "DESTINY · GRIMORIO" : game === "destiny2" ? "DESTINY 2 · RELATOS" : "RELATOS Y GRIMORIO"}</span>
            </div>
          )}
          {isGroupMode && !selectedGroup && (
            <div className="archive-route-nav chronicles-route-nav">
              <button
                className="archive-route-back"
                onClick={() => {
                  if (archiveMode === "releases" && game !== "all") {
                    setSearch("");
                    setSearchInput("");
                    changeMode("game");
                  } else {
                    returnHome();
                  }
                }}
                type="button"
              >
                {archiveMode === "releases" && game !== "all"
                  ? `← VOLVER A ${game === "destiny1" ? "DESTINY" : "DESTINY 2"}`
                  : "← VOLVER A LAS RUTAS"}
              </button>
              <nav className="chronicles-tabs" aria-label="Crónicas">
                {([
                    ["grimoire", "GRIMORIO"],
                    ["books", "LIBROS"],
                  ["releases", "LANZAMIENTOS"],
                  ["timeline", "RECORRIDO DEL GUARDIÁN"],
                ] as const).map(([mode, label]) => mode === "grimoire" ? (
                  <a
                    className="chronicles-grimoire-link"
                    href="/destiny/grimorio"
                    key={mode}
                    onClick={(event) => followInternalLink(event, () => openGameLore("destiny1"))}
                  >
                    {label}
                  </a>
                ) : (
                  <button
                    aria-current={archiveMode === mode ? "page" : undefined}
                    className={archiveMode === mode ? "filter-active" : ""}
                    key={mode}
                    onClick={() => openChronicles(mode)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {!isD1GrimoireDetail ? (
          <div className={`archive-toolbar${isD1Grimoire ? " archive-toolbar-grimoire" : ""}`}>
            <label className="search-field">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="visually-hidden">Buscar en el archivo</span>
              <input
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={isGroupMode && !selectedGroup
                  ? `Buscar ${(groupHeading ?? "índice").toLocaleLowerCase("es")}…`
                  : isD1Grimoire
                    ? "Busca una carta del Grimorio…"
                  : "Busca armas, armaduras, personajes, lugares y relatos…"}
                type="search"
                value={searchInput}
              />
              <span className="search-shortcut">⌕</span>
            </label>
            <div className="archive-filters" aria-label="Filtrar archivo">
              {!isGroupMode && archiveMode === "catalog" && <button
                aria-pressed={game === "all"}
                className={game === "all" ? "filter-active" : ""}
                onClick={() => { setPage(1); setGame("all"); navigatePath(pathForCatalog("all", catalogCategory)); }}
                type="button"
              >
                TODOS LOS JUEGOS
              </button>}
              {!isGroupMode && archiveMode === "catalog" && <button
                aria-pressed={game === "destiny1"}
                className={game === "destiny1" ? "filter-active" : ""}
                onClick={() => { setPage(1); setGame("destiny1"); navigatePath(pathForCatalog("destiny1", catalogCategory)); }}
                type="button"
              >
                DESTINY 1
              </button>}
              {!isGroupMode && archiveMode === "catalog" && <button
                aria-pressed={game === "destiny2"}
                className={game === "destiny2" ? "filter-active" : ""}
                onClick={() => { setPage(1); setGame("destiny2"); navigatePath(pathForCatalog("destiny2", catalogCategory)); }}
                type="button"
              >
                DESTINY 2
              </button>}
              {archiveMode === "catalog" ? (
                <>
                  {([
                    ["all", "TODO EL CATÁLOGO"],
                    ["weapons", "ARMAS"],
                    ["armor", "ARMADURAS"],
                    ["characters", "PERSONAJES"],
                    ["places", "LUGARES"],
                    ["species", "PUEBLOS Y CLASES"],
                    ["factions", "FACCIONES"],
                    ["objects", "OBJETOS CON LORE"],
                  ] as const).map(([category, label]) => (
                    <button
                      aria-pressed={catalogCategory === category}
                      className={catalogCategory === category ? "filter-active" : ""}
                      key={category}
                      onClick={() => {
                        setPage(1);
                        setCatalogCategory(category);
                        setCatalogRarity("");
                        navigatePath(pathForCatalog(game, category));
                        setCatalogClassType("all");
                      }}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          </div>
          ) : null}
          {archiveMode === "catalog" && ["all", "weapons", "armor", "objects"].includes(catalogCategory) && (
            <div className="archive-toolbar catalog-equipment-toolbar">
              <div className="archive-filters" aria-label="Filtrar equipo por rareza">
                <button
                  aria-pressed={!catalogRarity}
                  className={!catalogRarity ? "filter-active" : ""}
                  onClick={() => { setPage(1); setCatalogRarity(""); }}
                  type="button"
                >
                  TODAS LAS RAREZAS
                </button>
                {catalogRarities.map((rarity) => (
                  <button
                    aria-pressed={catalogRarity === rarity}
                    className={catalogRarity === rarity ? "filter-active" : ""}
                    key={rarity}
                    onClick={() => { setPage(1); setCatalogRarity(rarity); }}
                    type="button"
                  >
                    {rarity.toLocaleUpperCase("es")}
                  </button>
                ))}
              </div>
              {["all", "armor"].includes(catalogCategory) && (
                <div className="archive-filters" aria-label="Filtrar armaduras por clase">
                  {[
                    ["all", "TODAS LAS CLASES"],
                    ["0", "TITÁN"],
                    ["1", "CAZADOR"],
                    ["2", "HECHICERO"],
                  ].map(([classType, label]) => (
                    <button
                      aria-pressed={catalogClassType === classType}
                      className={catalogClassType === classType ? "filter-active" : ""}
                      key={classType}
                      onClick={() => {
                        setPage(1);
                        setCatalogClassType(classType);
                        if (classType !== "all") setCatalogCategory("armor");
                      }}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isD1Grimoire && !(archiveMode === "releases" && selectedGroup) && <div className="results-meta">
            <span>{loading ? "CONSULTANDO EL ARCHIVO…" : `${activeTotal?.toLocaleString("es-ES") ?? 0} ${archiveMode === "timeline" ? "HITOS" : isGroupMode && !selectedGroup ? "GRUPOS" : "REGISTROS"}`}</span>
            <span>
              {archiveMode === "timeline" || archiveMode === "books"
                  ? "FUENTE: BUNGIE + CLASIFICACIÓN EDITORIAL LOCAL"
                  : "FUENTE: MANIFIESTOS OFICIALES DE BUNGIE"}
            </span>
          </div>}

          {loading && !isD1Grimoire && (
            <ApiLoading compact message="Consultando el archivo y sus manifiestos…" />
          )}

          {error && !isD1Grimoire && (
            <div className="state-panel error-panel" role="alert">
              <span className="state-symbol">!</span>
              <div>
                <strong>No se pudo acceder al archivo</strong>
                <p>{error}</p>
                <p>Comprueba que la base de datos está iniciada y que has sincronizado el manifiesto.</p>
              </div>
            </div>
          )}

          {!isD1Grimoire && !error && !loading && activeTotal === 0 && archiveMode !== "timeline" && !(archiveMode === "releases" && selectedGroup) && (
            <div className="state-panel">
              <span className="state-symbol">⌕</span>
              <div>
                <strong>
                  No se encontraron registros
                </strong>
                <p>
                  Prueba con otro término o vuelve a mostrar todo el archivo.
                </p>
              </div>
            </div>
          )}

          {isGroupMode && selectedGroup && (
            <div className="group-detail-actions">
              <button className="group-back" onClick={backFromGroup} type="button">
                ← VOLVER A {(returnMode === "timeline"
                  ? "RECORRIDO DEL GUARDIÁN"
                  : returnMode === "raids"
                    ? "RAIDS"
                    : returnMode === "game"
                      ? game === "destiny1" ? "DESTINY" : "DESTINY 2"
                      : groupHeading ?? "ÍNDICE").toLocaleUpperCase("es")}
              </button>
            </div>
          )}

          {isD1Grimoire && !isD1GrimoireDetail && (
            <D1GrimoireArchive
              onClearPage={() => goBackOr("/destiny/grimorio")}
              onSelect={openLore}
              onSelectPage={(group) => navigatePath(pathForGrimoirePage(group))}
              search={search}
              selectedPageSlug={parseArchiveRoute(routePath).grimoirePageSlug}
            />
          )}
          {isD1GrimoireDetail && selected?.sourceGame === "destiny1" && (
            <LoreReader
              entry={selected}
              onClose={() => goBackOr("/destiny/grimorio")}
              onOpenReference={openLoreReference}
              presentation="page"
            />
          )}
          {isD1GrimoireDetail && !selected && <ApiLoading compact message="Abriendo la carta del Grimorio…" />}

          {archiveMode === "books" && selectedGroup && (
            <BookContext
              books={groups.filter((group) => group.groupType === "book")}
              group={selectedGroup}
              onOpenBook={(group) => {
                setSelectedGroup(group);
                navigatePath(pathForGroup(group));
              }}
            />
          )}

          {archiveMode === "releases" && selectedGroup && (
            <ReleaseArchiveDetail
              group={selectedGroup}
              key={selectedGroup.id}
              onOpenLore={openReleaseLore}
              onOpenCatalog={openCatalog}
              onOpenRaid={openRaidDetail}
              search={search}
            />
          )}

          {isGroupMode && !selectedGroup && !error && !loading && groupType && (
            <LoreGroupIndex groups={groups} onSelect={(group) => openGroup(group)} type={groupType} />
          )}
          {archiveMode === "timeline" && !error && !loading && (
            <TimelineArchive
              books={groups.filter((group) => group.groupType === "book")}
              onOpenGroup={openTimelineGroup}
              onOpenLore={openReleaseLore}
              releases={groups.filter((group) => group.groupType === "release")}
              search={search}
            />
          )}

          {!isD1Grimoire && !error && !(archiveMode === "releases" && selectedGroup) && (!isGroupMode || selectedGroup) && (
            archiveMode === "catalog"
              ? catalogResult?.items.length
              : archiveMode === "lore" || (archiveMode === "books" && selectedGroup)
                ? result?.items.length
                : false
          ) ? (
            archiveMode === "lore" || archiveMode === "books" ? (
              <div className="lore-grid">
                {result?.items.map((entry) => (
                  <LoreCard entry={entry} key={entry.id} onSelect={openLore} />
                ))}
              </div>
            ) : (
              <div className="equipment-grid">
                {catalogResult?.items.map((entry) => (
                  entry.category === "weapons" || entry.category === "armor" || entry.category === "objects"
                    ? <EquipmentTile entry={entry} key={entry.id} onSelect={openCatalog} />
                    : <CatalogCard entry={entry} key={entry.id} onSelect={openCatalog} />
                ))}
              </div>
            )
          ) : null}

          {!isD1Grimoire && archiveMode !== "raids" && (!(archiveMode === "releases" && selectedGroup) && (!isGroupMode || selectedGroup)) && <div className="pagination">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              type="button"
            >
              ← ANTERIOR
            </button>
            <span>PÁGINA {page} {activeTotal ? `/ ${Math.max(1, Math.ceil(activeTotal / PAGE_SIZE))}` : ""}</span>
            <button
              disabled={!(archiveMode === "catalog" ? catalogResult?.hasMore : result?.hasMore) || loading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              SIGUIENTE →
            </button>
          </div>}
        </section>}

        <section className="project-note">
          <span className="note-mark" aria-hidden="true">✳</span>
          <div>
            <span className="eyebrow">UN ARCHIVO EN CONSTRUCCIÓN</span>
            <p>
              Estamos reuniendo las historias dispersas del universo de Destiny. Las traducciones
              priorizan la terminología oficial en español y cada vídeo se revisa antes de añadirse.
            </p>
            <p className="project-credits">
              Archivo comunitario sin ánimo de lucro para Guardianes de Latinoamérica y España.
              Destiny y sus elementos pertenecen a sus respectivos titulares. Gracias a{" "}
              <a href="https://www.bungie.net/" rel="noreferrer" target="_blank">Bungie</a>{" "}
              por sus manifiestos. Proyecto de fans, no oficial y sin afiliación con Bungie.
            </p>
          </div>
          <span className="note-signature">POR LA LUZ.</span>
        </section>
      </main>
      <footer className="site-footer">
        <div className="site-footer-brand">
          <img alt="" height="54" src="/media/archivo.png" width="54" />
          <span>ARCHIVO DEL VIAJERO</span>
        </div>
        <div className="site-footer-notice">
          <span>PROYECTO COMUNITARIO SIN ÁNIMO DE LUCRO · NO OFICIAL · NO AFILIADO CON BUNGIE</span>
          <span>QUE LA LUZ TE GUÍE</span>
        </div>
        <nav className="site-footer-socials" aria-label="Enlaces personales">
          <a
            href="https://www.linkedin.com/in/miguel-angel-ledesma-rodriguez"
            rel="noreferrer"
            target="_blank"
            aria-label="LinkedIn de Miguel Ángel"
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.7v2.2h.07c.65-1.23 2.23-2.53 4.59-2.53 4.9 0 5.8 3.22 5.8 7.41V24h-5v-6.5c0-1.55-.03-3.55-2.16-3.55-2.16 0-2.49 1.68-2.49 3.42V24h-5V8z" />
            </svg>
          </a>
          <a
            href="https://github.com/MALR07"
            rel="noreferrer"
            target="_blank"
            aria-label="GitHub de Miguel Ángel"
            title="GitHub"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <a
            href="https://portfolio-miguel-a-ledesma.netlify.app/"
            rel="noreferrer"
            target="_blank"
            aria-label="Portafolio de Miguel Ángel"
            title="Portafolio"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
            </svg>
          </a>
        </nav>
      </footer>
      {selected && selected.sourceGame !== "destiny1" && (
        <LoreReader
          entry={selected}
          onClose={() => {
            setSelected(null);
            goBackOr(`/${selected.sourceGame === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}`);
          }}
          onOpenReference={openLoreReference}
        />
      )}
      {selectedCatalog && (
        <CatalogReader
          entry={selectedCatalog}
          onClose={() => {
            setSelectedCatalog(null);
            goBackOr(pathForCatalog(selectedCatalog.sourceGame, selectedCatalog.category));
          }}
        />
      )}
      </>
    </Suspense>
  );
}
