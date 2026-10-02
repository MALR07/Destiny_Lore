import { useMemo } from "react";
import { describeTimelineRelease, guardianTimelineIntro } from "../data/guardian-timeline";
import type { MediaEntry } from "../data/media";
import type { LoreGroup } from "../types/lore";
import MediaArchive from "./MediaArchive";

interface TimelineArchiveProps {
  releases: LoreGroup[];
  books: LoreGroup[];
  media: MediaEntry[];
  search: string;
  onOpenGroup: (group: LoreGroup) => void;
  onOpenLore: (id: string) => void;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
}

export default function TimelineArchive({
  releases,
  books,
  media,
  search,
  onOpenGroup,
  onOpenLore,
}: TimelineArchiveProps) {
  const orderedReleases = useMemo(() => {
    const query = normalize(search);
    return releases
      .filter((group) => group.releaseSlug !== "destiny-2-beta")
      .filter((group) => !query || normalize(`${group.title} ${group.titleEn}`).includes(query))
      .sort((left, right) => {
        if (left.releaseSlug && !right.releaseSlug) return -1;
        if (!left.releaseSlug && right.releaseSlug) return 1;
        if (left.releaseSlug && right.releaseSlug) {
          return (right.releaseOrder ?? 0) - (left.releaseOrder ?? 0);
        }
        return (left.releaseNumber ?? 0) - (right.releaseNumber ?? 0);
      });
  }, [releases, search]);

  const booksByRelease = useMemo(() => {
    const grouped = new Map<string, LoreGroup[]>();
    for (const book of books) {
      if (!book.releaseSlug) continue;
      const items = grouped.get(book.releaseSlug) ?? [];
      items.push(book);
      grouped.set(book.releaseSlug, items);
    }
    return grouped;
  }, [books]);

  if (orderedReleases.length === 0) {
    return (
      <div className="state-panel">
        <span className="state-symbol">⌕</span>
        <div>
          <strong>No hay hitos para mostrar</strong>
          <p>Prueba con otro término o comprueba que los grupos de Bungie estén sincronizados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guardian-timeline">
      <p className="timeline-intro">{guardianTimelineIntro}</p>
      <div className="timeline-list">
        {orderedReleases.map((release, index) => {
          const slug = release.releaseSlug;
          const releaseBooks = slug ? booksByRelease.get(slug) ?? [] : [];
          const videos = media.filter((entry) =>
            entry.kind === "video" && entry.language === "es" && entry.releaseSlug === slug,
          );

          return (
            <article className="timeline-event" key={release.id}>
              <span className="timeline-marker" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className="timeline-event-content">
                <div className="timeline-event-heading">
                  <div>
                    <span className="eyebrow">
                      {!slug
                        ? "BUNGIE · SIN POSICIÓN EN EL ÍNDICE LOCAL"
                        : release.sourceGame === "destiny1"
                          ? "DESTINY · EL COMIENZO"
                          : "DESTINY 2 · ARCHIVO OFICIAL"}
                    </span>
                    <h3>{release.title}</h3>
                  </div>
                  <span className="timeline-entry-count">
                    {release.localEntryCount.toLocaleString("es-ES")} RELATOS
                  </span>
                </div>
                <p>{describeTimelineRelease(slug, release.title)}</p>
                {releaseBooks.length > 0 && (
                  <div className="timeline-books">
                    <span className="eyebrow">LIBROS DE ESTA ETAPA</span>
                    <div>
                      {releaseBooks
                        .filter((book) => !search || normalize(`${book.title} ${book.titleEn}`).includes(normalize(search)))
                        .map((book) => (
                        <button key={book.id} onClick={() => onOpenGroup(book)} type="button">
                          {book.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {release.lorePreview.length > 0 && (
                  <div className="timeline-lore">
                    <span className="eyebrow">RELATOS DESTACADOS DE BUNGIE</span>
                    <div>
                      {release.lorePreview.map((entry) => (
                        <button key={entry.id} onClick={() => onOpenLore(entry.id)} type="button">
                          {entry.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {videos.length > 0 && (
                  <div className="timeline-videos">
                    <span className="eyebrow">CINEMÁTICAS EN ESPAÑOL</span>
                    <MediaArchive entries={videos} search="" />
                  </div>
                )}
                {videos.length === 0 && (
                  <p className="timeline-video-empty">CINEMÁTICA EN ESPAÑOL: PENDIENTE DE AÑADIR</p>
                )}
                <button
                  className="timeline-open-release"
                  onClick={() => onOpenGroup(release)}
                  type="button"
                >
                  ABRIR FICHA DEL LANZAMIENTO <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
