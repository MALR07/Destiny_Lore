import { useEffect, useMemo, useState } from "react";
import { getLore, getLoreGroups } from "../lib/api";
import { followInternalLink } from "../lib/navigation";
import { pathForGrimoirePage, routeSlug } from "../lib/routes";
import type { LoreEntry, LoreGroup, LorePage } from "../types/lore";
import ApiLoading from "./ApiLoading";
import LoreCard from "./LoreCard";

interface D1GrimoireArchiveProps {
  search: string;
  onSelect: (entry: LoreEntry) => void;
  selectedPageSlug?: string;
  onSelectPage?: (group: LoreGroup) => void;
  onClearPage?: () => void;
}

// ---------------------------------------------------------------------------
// DICCIONARIO DE IMÁGENES LOCALES
// Define tus imágenes asociándolas al título exacto o ID de la categoría.
// Las rutas deben ser relativas a la carpeta public/ (ej: public/grimoire/guardia.jpg -> "/grimoire/guardia.jpg")
// ---------------------------------------------------------------------------
const MIS_IMAGENES_GRIMORIO: Record<string, string> = {
  // Ejemplos:
  "Guardianes": "/media/Cartas grimorio/guardianes.webp",
    "Clases": "/media/Cartas grimorio/clases.webp",
    "Razas": "/media/Cartas grimorio/razas.webp",
    "Espectro": "/media/Cartas grimorio/escprectro.webp",
    "Subclases": "/media/Cartas grimorio/subclases.webp",
    "Habilidades de cuerpo a cuerpo": "/media/Cartas grimorio/habilidades cuerpo a cuerpo.webp",
    "Habilidades de granada": "/media/Cartas grimorio/habilidades granada.webp",
    "Tipos de movimiento": "/media/Cartas grimorio/tipop moviivmento.webp", 
    "Superhabilidad": "/media/Cartas grimorio/superhabilidad.webp",
  "Inventario": "/media/Cartas grimorio/inventario.webp",
    "Armas principales": "/media/Cartas grimorio/armas principales.webp",
    "Armas especiales": "/media/Cartas grimorio/especiales.webp",
    "Armas pesadas": "/media/Cartas grimorio/pesadas.webp",
    "Tipos de daño": "/media/Cartas grimorio/tipos daño.webp",
    "Vehículos de guardianes": "/media/Cartas grimorio/veiculos guardias.webp",
    "Economía": "/media/Cartas grimorio/economia.webp",
  "Aliados": "/media/Cartas grimorio/aliados.webp",
     "El Viajero": "/media/Cartas grimorio/viajero.webp",
     "Aliados de la Torre": "/media/Cartas grimorio/aliados torre.webp",
     "Facciones de la Ciudad": "/media/Cartas grimorio/facciones ciudad.webp",
      "La desconocida exo": "/media/Cartas grimorio/exo desconocidad.webp",
      "La Reina": "/media/Cartas grimorio/la reina.webp",
      "Rasputín": "/media/Cartas grimorio/rasputin.webp",
      "Osiris": "/media/Cartas grimorio/osiris.webp",
      "Leyendas y misterios": "/media/Cartas grimorio/leyyendas y misterios.webp",
      "Los señores de hierro": "/media/Cartas grimorio/señores hierro.webp",
  "Enemigos": "/media/Cartas grimorio/enemigos.webp",
    "Caídos": "/media/Cartas grimorio/caidos.webp",
    "Arsenal de los caídos": "/media/Cartas grimorio/arsenal caido.webp",
    "Líderes caídos": "/media/Cartas grimorio/lideres caidos.webp",
    "Caídos cazados": "/media/Cartas grimorio/caidos cazados.webp",
    "La Colmena": "/media/Cartas grimorio/colmena.webp",
    "Arsenal de la colmena": "/media/Cartas grimorio/arseanal colmena.webp",
    "Colmena exaltada": "/media/Cartas grimorio/colmena exaltada.webp",
    "Vex": "/media/Cartas grimorio/vex.webp",
    "Arsenal de los vex": "/media/Cartas grimorio/arsenal vex.webp",
    "Mentes del Eje vex": "/media/Cartas grimorio/metes del eje vex.webp",
    "Cabal": "/media/Cartas grimorio/cabal.webp",
    "Arsenal de los cabal": "/media/Cartas grimorio/arseanl cabal.webp",
    "Mando cabal": "/media/Cartas grimorio/mando cabal.webp",
    "La Oscuridad": "/media/Cartas grimorio/la oscuirdad.webp",
    "Libros del Dolor": "/media/Cartas grimorio/libros del dolor.webp",
    "Los poseídos": "/media/Cartas grimorio/los poseidos.webp",
    "La SIVA": "/media/Cartas grimorio/la siva.webp",
  "Lugares": "/media/Cartas grimorio/lugares.webp",
    "Mercurio": "/media/Cartas grimorio/mercurio.webp",
    "Venus": "/media/Cartas grimorio/venus.webp",
    "La Tierra": "/media/Cartas grimorio/tierra.webp",
    "La Ciudad": "/media/Cartas grimorio/la ciudad.webp",
    "La Luna": "/media/Cartas grimorio/la luna.webp",
    "Marte": "/media/Cartas grimorio/marte.webp",
    "El Cinturón de Asteroides": "/media/Cartas grimorio/cinturon de asteroides.webp",
    "Júpiter": "/media/Cartas grimorio/jupiter.webp",
    "Saturno": "/media/Cartas grimorio/saturno.webp",
   "Actividades": "/media/Cartas grimorio/actividades.webp",
    "Historia: Antigua Rusia, la Tierra": "/media/Cartas grimorio/hgistoria rusia.webp",
    "Historia: Océano de las Tormentas, la Luna": "/media/Cartas grimorio/hisrotioa luna.webp",
    "Historia: Sumidero de Ishtar, Venus": "/media/Cartas grimorio/historia istar venus.webp",
    "Historia: Bahía del Meridiano, Marte": "/media/Cartas grimorio/historia bahia del meridiano marte.webp",
    "La profunda oscuridad": "/media/Cartas grimorio/profunda oscuridad.webp",
    "La Casa de los Lobos": "/media/Cartas grimorio/casa lobos.webp",
    "El Rey de los Poseídos": "/media/Cartas grimorio/rey poseidos.webp",
    "Asaltos": "/media/Cartas grimorio/asaltos.webp",
    "Incursiones": "/media/Cartas grimorio/incosion.webp",
    "Listas de juego del Crisol": "/media/Cartas grimorio/lista crisol.webp",
    "Arenas del Crisol": "/media/Cartas grimorio/arenas crisol.webp",
    "Otras actividades": "/media/Cartas grimorio/otras actividades.webp",
    "Los Señores de Hierro": "/media/Cartas grimorio/los señores de hierroi.webp",

};

function orderedGroups(groups: LoreGroup[]): LoreGroup[] {
  return [...groups].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
      || left.title.localeCompare(right.title, "es"),
  );
}

export default function D1GrimoireArchive({ search, onSelect, selectedPageSlug, onSelectPage, onClearPage }: D1GrimoireArchiveProps) {
  const [groups, setGroups] = useState<LoreGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<LoreGroup | null>(null);
  const [result, setResult] = useState<LorePage | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    setGroupsLoading(true);
    setGroupsError(null);
    getLoreGroups("category", "", controller.signal)
      .then((items) => setGroups(orderedGroups(items.filter((group) => group.sourceGame === "destiny1"))))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setGroupsError(reason instanceof Error ? reason.message : "No se pudieron cargar las categorías del Grimorio.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setGroupsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (!selectedPageSlug) {
      setSelectedPage(null);
      return;
    }
    const match = groups.find((group) =>
      pathForGrimoirePage(group).endsWith(`/${selectedPageSlug}`)
      || routeSlug(group.titleEn || group.title) === selectedPageSlug,
    );
    if (match) setSelectedPage(match);
  }, [groups, selectedPageSlug]);

  useEffect(() => {
    if (!selectedPage && !search.trim()) {
      setResult(null);
      setEntriesError(null);
      setEntriesLoading(false);
      return;
    }

    const controller = new AbortController();
    setEntriesLoading(true);
    setEntriesError(null);
    getLore(search, page, false, "destiny1", controller.signal, selectedPage?.id)
      .then(setResult)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setEntriesError(reason instanceof Error ? reason.message : "No se pudieron cargar las cartas del Grimorio.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setEntriesLoading(false);
      });
    return () => controller.abort();
  }, [page, search, selectedPage]);

  const themeGroups = useMemo(
    () => groups.filter((group) => group.parentGroupId == null),
    [groups],
  );
  const pageGroups = useMemo(
    () => new Map(themeGroups.map((theme) => [
      theme.id,
      orderedGroups(groups.filter((group) => group.parentGroupId === theme.id)),
    ])),
    [groups, themeGroups],
  );
  const hasSearch = Boolean(search.trim());

  function selectPage(group: LoreGroup) {
    setSelectedPage(group);
    setPage(1);
    onSelectPage?.(group);
  }

  function clearSelection() {
    setSelectedPage(null);
    setPage(1);
    if (selectedPageSlug) onClearPage?.();
  }

  return (
    <section className="d1-grimoire" aria-label="Índice del Grimorio de Destiny 1">
      {groupsLoading ? (
        <ApiLoading compact message="Recuperando las categorías oficiales del Grimorio…" />
      ) : groupsError ? (
        <div className="state-panel error-panel" role="alert">
          <strong>No se pudo cargar el índice del Grimorio</strong>
          <p>{groupsError}</p>
        </div>
      ) : themeGroups.length === 0 ? (
        <div className="state-panel error-panel" role="alert">
          <strong>El índice oficial del Grimorio todavía no está sincronizado</strong>
          <p>Sincroniza los grupos de lore desde los manifiestos de Bungie para mostrar las categorías y subcategorías de Destiny 1.</p>
        </div>
      ) : (
        <>
          {!selectedPage && !hasSearch && (
            <nav className="d1-grimoire-nav" aria-label="Categorías del Grimorio">
              {themeGroups.map((theme) => (
                <a href={`#d1-grimoire-${theme.id}`} key={theme.id}>{theme.title}</a>
              ))}
            </nav>
          )}

          {selectedPage ? (
            <div className="d1-grimoire-entries">
              <div className="d1-grimoire-page-heading">
                <button className="archive-route-back" onClick={clearSelection} type="button">
                  ← VOLVER A LAS CATEGORÍAS
                </button>
                <div>
                  <span className="eyebrow">{selectedPage.title}</span>
                  <h3>{selectedPage.localEntryCount.toLocaleString("es-ES")} cartas del Grimorio</h3>
                </div>
              </div>
              {entriesError ? (
                <div className="state-panel error-panel" role="alert">
                  <strong>No se pudieron cargar las cartas</strong>
                  <p>{entriesError}</p>
                </div>
              ) : entriesLoading ? (
                <ApiLoading compact message="Abriendo las cartas de esta sección…" />
              ) : result?.items.length ? (
                <>
                  <div className="lore-grid">
                    {result.items.map((entry) => (
                      <LoreCard entry={entry} key={entry.id} onSelect={onSelect} />
                    ))}
                  </div>
                  <div className="pagination">
                    <button disabled={page <= 1 || entriesLoading} onClick={() => setPage((current) => current - 1)} type="button">
                      ← ANTERIOR
                    </button>
                    <span>PÁGINA {page} / {Math.max(1, Math.ceil((result.total ?? 0) / result.limit))}</span>
                    <button disabled={!result.hasMore || entriesLoading} onClick={() => setPage((current) => current + 1)} type="button">
                      SIGUIENTE →
                    </button>
                  </div>
                </>
              ) : (
                <div className="state-panel">
                  <strong>No se encontraron cartas</strong>
                  <p>Prueba con otra búsqueda o vuelve al índice del Grimorio.</p>
                </div>
              )}
            </div>
          ) : hasSearch ? (
            <div className="d1-grimoire-entries">
              <div className="results-meta">
                <span>{entriesLoading ? "BUSCANDO EN EL GRIMORIO…" : `${result?.total.toLocaleString("es-ES") ?? 0} CARTAS`}</span>
                <span>DESTINY 1 · MANIFIESTO DE BUNGIE</span>
              </div>
              {entriesError ? (
                <div className="state-panel error-panel" role="alert">
                  <strong>No se pudo buscar en el Grimorio</strong>
                  <p>{entriesError}</p>
                </div>
              ) : entriesLoading ? (
                <ApiLoading compact message="Buscando cartas del Grimorio…" />
              ) : result?.items.length ? (
                <div className="lore-grid">
                  {result.items.map((entry) => (
                    <LoreCard entry={entry} key={entry.id} onSelect={onSelect} />
                  ))}
                </div>
              ) : (
                <div className="state-panel">
                  <strong>No se encontraron cartas</strong>
                  <p>Prueba con otro término de búsqueda.</p>
                </div>
              )}
              {result?.total ? (
                <div className="pagination">
                  <button disabled={page <= 1 || entriesLoading} onClick={() => setPage((current) => current - 1)} type="button">
                    ← ANTERIOR
                  </button>
                  <span>PÁGINA {page} / {Math.max(1, Math.ceil(result.total / result.limit))}</span>
                  <button disabled={!result.hasMore || entriesLoading} onClick={() => setPage((current) => current + 1)} type="button">
                    SIGUIENTE →
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="d1-grimoire-themes">
              {themeGroups.map((theme, index) => {
                const imagenTemaPersonalizada = MIS_IMAGENES_GRIMORIO[theme.title] || MIS_IMAGENES_GRIMORIO[theme.id] || theme.imageUrl;

                return (
                  <section className="d1-grimoire-theme" id={`d1-grimoire-${theme.id}`} key={theme.id}>
                    <header>
                      {imagenTemaPersonalizada && (
                        <img
                          alt=""
                          className="d1-grimoire-theme-art"
                          loading="lazy"
                          onError={(event) => { event.currentTarget.hidden = true; }}
                          src={imagenTemaPersonalizada}
                        />
                      )}
                      <span className="eyebrow">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{theme.title}</h3>
                      <span>{theme.localEntryCount.toLocaleString("es-ES")} cartas</span>
                    </header>
                    <div className="d1-grimoire-page-grid">
                      {(pageGroups.get(theme.id) ?? []).map((group) => {
                        const imagenGrupoPersonalizada = MIS_IMAGENES_GRIMORIO[group.title] || MIS_IMAGENES_GRIMORIO[group.id] || group.imageUrl;

                        return (
                          <a
                            className="d1-grimoire-page-card"
                            href={pathForGrimoirePage(group)}
                            key={group.id}
                            onClick={(event) => followInternalLink(event, () => selectPage(group))}
                          >
                            {imagenGrupoPersonalizada && (
                              <img
                                alt=""
                                className="d1-grimoire-page-art"
                                loading="lazy"
                                onError={(event) => { event.currentTarget.hidden = true; }}
                                src={imagenGrupoPersonalizada}
                              />
                            )}
                            <span className="eyebrow">
                              
                            </span>
                            <strong>{group.title}</strong>
                            <span>{group.localEntryCount.toLocaleString("es-ES")} cartas <i aria-hidden="true">↗</i></span>
                          </a>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}