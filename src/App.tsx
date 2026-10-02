import { useEffect, useState } from "react";
import { mediaEntries } from "./data/media";
import LoreCard from "./components/LoreCard";
import LoreGroupIndex from "./components/LoreGroupIndex";
import LoreReader from "./components/LoreReader";
import BookContext from "./components/BookContext";
import ReleaseArchiveDetail from "./components/ReleaseArchiveDetail";
import TimelineArchive from "./components/TimelineArchive";
import CatalogCard from "./components/CatalogCard";
import EquipmentTile from "./components/EquipmentTile";
import CatalogReader from "./components/CatalogReader";
import SiteHeader from "./components/SiteHeader";
import ArchiveLanding from "./components/ArchiveLanding";
import GamePortal from "./components/GamePortal";
import StellarMap from "./components/StellarMap";
import RaidArchive from "./components/RaidArchive";
import RaidDetail from "./components/RaidDetail";
import { raids } from "./data/raids";
import { getCatalog, getCatalogEntryById, getLore, getLoreEntryById, getLoreGroups } from "./lib/api";
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

export default function App() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [withVideos, setWithVideos] = useState(false);
  const [game, setGame] = useState<"all" | "destiny1" | "destiny2">("all");
  const [archiveMode, setArchiveMode] = useState<
    "home" | "game" | "destinations" | "raids" | "raid-detail" | "lore" | "books" | "releases" | "timeline" | "catalog"
  >("home");
  const [returnMode, setReturnMode] = useState<"game" | "raids" | "timeline" | null>(null);
  const [groups, setGroups] = useState<LoreGroup[]>([]);
  const [selectedRaid, setSelectedRaid] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<LoreGroup | null>(null);
  const [catalogCategory, setCatalogCategory] = useState<CatalogCategory>("all");
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

  async function openLoreReference(reference: LoreReference) {
    setSelected(null);
    setSelectedCatalog(null);
    try {
      if (reference.kind === "lore") {
        setSelected(await getLoreEntryById(reference.id));
      } else {
        setSelectedCatalog(await getCatalogEntryById(reference.id));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo abrir la referencia.");
    }
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
          setGroups(archiveMode === "releases" && game !== "all"
            ? data.filter((group) => group.sourceGame === game)
            : data);
        })
        : archiveMode !== "catalog"
        ? getLore(
          search,
          page,
          withVideos && !groupType,
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
  }, [search, page, withVideos, game, archiveMode, catalogCategory, catalogRarity, catalogClassType, selectedGroup]);

  async function openReleaseLore(id: string) {
    try {
      setSelectedCatalog(null);
      setSelected(await getLoreEntryById(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo abrir el relato traducido.");
    }
  }

  const isGroupMode = ["books", "releases", "timeline"].includes(archiveMode);
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
    window.setTimeout(() => document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth" }), 0);
  }
  function openRaidDetail(raidId: string) {
    setSelectedRaid(raidId);
    setArchiveMode("raid-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function backToRaids() {
    setSelectedRaid(null);
    setArchiveMode("raids");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openGroup(group: LoreGroup, returnTo: "game" | "raids" | "timeline" | null = null) {
    setPage(1);
    setSearch("");
    setSearchInput("");
    setReturnMode(returnTo);
    setSelectedGroup(group);
    setArchiveMode(group.groupType === "book" ? "books" : "releases");
  }
  function openTimelineGroup(group: LoreGroup) {
    openGroup(group, "timeline");
  }
  function backFromGroup() {
    setSelectedGroup(null);
    if (returnMode) setArchiveMode(returnMode);
    setReturnMode(null);
  }
  const activeRaid = raids.find((raid) => raid.id === selectedRaid);

  return (
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
              src="https://wallpapers.com/images/hd/the-traveler-ascending-from-the-last-city-in-destiny-80yfepu91utafi91.jpg"
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
          <a
            className="hero-art-credit"
            href="https://wallpapers.com/wallpapers/the-traveler-ascending-from-the-last-city-in-destiny-80yfepu91utafi91.html"
            rel="noreferrer"
            target="_blank"
          >
            ARTE DE DESTINY · FUENTE WALLPAPERS.COM ↗
          </a>
        </section>

        {archiveMode === "home" && (
          <div id="rutas">
            <ArchiveLanding
              onOpenGame={openGame}
              onOpenChronicles={openChronicles}
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
              <div className="stellar-loading" role="status">RECUPERANDO EL ARCHIVO DE INCURSIONES…</div>
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
            onOpenLocation={setSelectedCatalog}
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
                : archiveMode === "books"
                    ? "Libros de Bungie agrupados por lanzamiento; su clasificación editorial no sustituye el texto oficial."
                      : archiveMode === "releases"
                      ? "Lanzamientos vinculados a los manifiestos oficiales de Bungie, del más reciente al más antiguo."
                        : archiveMode === "timeline"
                          ? "El viaje del Guardián, desde su despertar, con relatos oficiales, libros y espacio para cinemáticas en español."
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
              <button className="archive-route-back" onClick={() => changeMode("game")} type="button">
                ← VOLVER A {game === "destiny1" ? "DESTINY" : game === "destiny2" ? "DESTINY 2" : "LAS RUTAS"}
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
                  ["books", "LIBROS"],
                  ["releases", "LANZAMIENTOS"],
                  ["timeline", "RECORRIDO DEL GUARDIÁN"],
                ] as const).map(([mode, label]) => (
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

          <div className="archive-toolbar">
            <label className="search-field">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="visually-hidden">Buscar en el archivo</span>
              <input
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={isGroupMode && !selectedGroup
                  ? `Buscar ${(groupHeading ?? "índice").toLocaleLowerCase("es")}…`
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
                onClick={() => { setPage(1); setGame("all"); }}
                type="button"
              >
                TODOS LOS JUEGOS
              </button>}
              {!isGroupMode && archiveMode === "catalog" && <button
                aria-pressed={game === "destiny1"}
                className={game === "destiny1" ? "filter-active" : ""}
                onClick={() => { setPage(1); setGame("destiny1"); }}
                type="button"
              >
                DESTINY 1
              </button>}
              {!isGroupMode && archiveMode === "catalog" && <button
                aria-pressed={game === "destiny2"}
                className={game === "destiny2" ? "filter-active" : ""}
                onClick={() => { setPage(1); setGame("destiny2"); }}
                type="button"
              >
                DESTINY 2
              </button>}
              {archiveMode === "lore" ? (
                <>
                  <button
                    aria-pressed={!withVideos}
                    className={!withVideos ? "filter-active" : ""}
                    onClick={() => { setPage(1); setWithVideos(false); }}
                    type="button"
                  >
                    SIN FILTRO DE VÍDEO
                  </button>
                  <button
                    aria-pressed={withVideos}
                    className={withVideos ? "filter-active" : ""}
                    onClick={() => { setPage(1); setWithVideos(true); }}
                    type="button"
                  >
                    ◉ &nbsp; CON VÍDEO
                  </button>
                </>
              ) : archiveMode === "catalog" ? (
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

          {!(archiveMode === "releases" && selectedGroup) && <div className="results-meta">
            <span>{loading ? "CONSULTANDO EL ARCHIVO…" : `${activeTotal?.toLocaleString("es-ES") ?? 0} ${archiveMode === "timeline" ? "HITOS" : isGroupMode && !selectedGroup ? "GRUPOS" : "REGISTROS"}`}</span>
            <span>
              {archiveMode === "timeline" || archiveMode === "books"
                  ? "FUENTE: BUNGIE + CLASIFICACIÓN EDITORIAL LOCAL"
                  : "FUENTE: MANIFIESTOS OFICIALES DE BUNGIE"}
            </span>
          </div>}

          {error && (
            <div className="state-panel error-panel" role="alert">
              <span className="state-symbol">!</span>
              <div>
                <strong>No se pudo acceder al archivo</strong>
                <p>{error}</p>
                <p>Comprueba que la base de datos está iniciada y que has sincronizado el manifiesto.</p>
              </div>
            </div>
          )}

          {!error && !loading && activeTotal === 0 && archiveMode !== "timeline" && !(archiveMode === "releases" && selectedGroup) && (
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

          {archiveMode === "books" && selectedGroup && (
            <BookContext
              books={groups.filter((group) => group.groupType === "book")}
              group={selectedGroup}
              onOpenBook={setSelectedGroup}
            />
          )}

          {archiveMode === "releases" && selectedGroup && (
            <ReleaseArchiveDetail
              group={selectedGroup}
              key={selectedGroup.id}
              onOpenLore={openReleaseLore}
              onOpenCatalog={setSelectedCatalog}
              search={search}
            />
          )}

          {isGroupMode && !selectedGroup && !error && !loading && groupType && (
            <LoreGroupIndex groups={groups} onSelect={(group) => openGroup(group)} type={groupType} />
          )}
          {archiveMode === "timeline" && !error && !loading && (
            <TimelineArchive
              books={groups.filter((group) => group.groupType === "book")}
              media={mediaEntries}
              onOpenGroup={openTimelineGroup}
              onOpenLore={openReleaseLore}
              releases={groups.filter((group) => group.groupType === "release")}
              search={search}
            />
          )}

          {!error && !(archiveMode === "releases" && selectedGroup) && (!isGroupMode || selectedGroup) && (archiveMode === "catalog" ? catalogResult?.items.length           : archiveMode === "lore" || (archiveMode === "books" && selectedGroup) ? result?.items.length : false) ? (
            archiveMode === "lore" || archiveMode === "books" ? (
              <div className="lore-grid">
                {result?.items.map((entry) => (
                  <LoreCard entry={entry} key={entry.id} onSelect={setSelected} />
                ))}
              </div>
            ) : (
              <div className="equipment-grid">
                {catalogResult?.items.map((entry) => (
                  entry.category === "weapons" || entry.category === "armor" || entry.category === "objects"
                    ? <EquipmentTile entry={entry} key={entry.id} onSelect={setSelectedCatalog} />
                    : <CatalogCard entry={entry} key={entry.id} onSelect={setSelectedCatalog} />
                ))}
              </div>
            )
          ) : null}

          {archiveMode !== "raids" && (!(archiveMode === "releases" && selectedGroup) && (!isGroupMode || selectedGroup)) && <div className="pagination">
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
              Archivo comunitario para Guardianes de Latinoamérica y España. Gracias a{" "}
              <a href="https://www.bungie.net/" rel="noreferrer" target="_blank">Bungie</a>{" "}
              por Destiny y sus manifiestos. Proyecto de fans, sin afiliación oficial.
            </p>
          </div>
          <span className="note-signature">POR LA LUZ.</span>
        </section>
      </main>
      <footer className="site-footer">
        <span>ARCHIVO DEL VIAJERO</span>
        <span>PROYECTO DE FANS · NO AFILIADO CON BUNGIE</span>
        <span>QUE LA LUZ TE GUÍE</span>
      </footer>
      {selected && (
        <LoreReader
          entry={selected}
          onClose={() => setSelected(null)}
          onOpenReference={openLoreReference}
        />
      )}
      {selectedCatalog && (
        <CatalogReader entry={selectedCatalog} onClose={() => setSelectedCatalog(null)} />
      )}
    </>
  );
}
