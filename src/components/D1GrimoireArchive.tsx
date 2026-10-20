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
              {themeGroups.map((theme, index) => (
                <section className="d1-grimoire-theme" id={`d1-grimoire-${theme.id}`} key={theme.id}>
                  <header>
                    {theme.imageUrl && (
                      <img
                        alt=""
                        className="d1-grimoire-theme-art"
                        loading="lazy"
                        onError={(event) => { event.currentTarget.hidden = true; }}
                        src={theme.imageUrl}
                      />
                    )}
                    <span className="eyebrow">
                      {theme.imageUrl ? "CARTA DESTACADA · " : ""}CATEGORÍA {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{theme.title}</h3>
                    <span>{theme.localEntryCount.toLocaleString("es-ES")} cartas</span>
                  </header>
                  <div className="d1-grimoire-page-grid">
                    {(pageGroups.get(theme.id) ?? []).map((group) => (
                      <a
                        className="d1-grimoire-page-card"
                        href={pathForGrimoirePage(group)}
                        key={group.id}
                        onClick={(event) => followInternalLink(event, () => selectPage(group))}
                      >
                        {group.imageUrl && (
                          <img
                            alt=""
                            className="d1-grimoire-page-art"
                            loading="lazy"
                            onError={(event) => { event.currentTarget.hidden = true; }}
                            src={group.imageUrl}
                          />
                        )}
                        <span className="eyebrow">
                          {group.imageUrl ? "CARTA REPRESENTATIVA · " : ""}SECCIÓN DEL GRIMORIO
                        </span>
                        <strong>{group.title}</strong>
                        <span>{group.localEntryCount.toLocaleString("es-ES")} cartas <i aria-hidden="true">↗</i></span>
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
