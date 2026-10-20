import { useMemo } from "react";
import { describeTimelineRelease, guardianTimelineIntro } from "../data/guardian-timeline";
import { followInternalLink } from "../lib/navigation";
import { pathForGroup } from "../lib/routes";
import type { LoreGroup } from "../types/lore";

const STORY_VIDEO_BY_RELEASE: Record<string, {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  startAt?: number;
}> = {
  destiny: {
    videoId: "7bfAAf-TKpA",
    title: "Destiny 1: campaña base completa",
    channelName: "TheWildGamer",
    channelUrl: "https://www.youtube.com/@TheWildGamer95",
  },
  "the-dark-below": {
    videoId: "BlC2_DUTdMQ",
    title: "Destiny 1: La profunda oscuridad",
    channelName: "TheWildGamer",
    channelUrl: "https://www.youtube.com/@TheWildGamer95",
  },
  "house-of-wolves": {
    videoId: "IrAwwcyHpA8",
    title: "Destiny 1: La Casa de los Lobos",
    channelName: "TheWildGamer",
    channelUrl: "https://www.youtube.com/@TheWildGamer95",
  },
  "the-taken-king": {
    videoId: "WbWIcWxVdOk",
    title: "Destiny 1: El Rey de los Poseídos",
    channelName: "TheWildGamer",
    channelUrl: "https://www.youtube.com/@TheWildGamer95",
  },
  "rise-of-iron": {
    videoId: "DAv9WrSeNtE",
    title: "Destiny 1: Los Señores de Hierro",
    channelName: "TheWildGamer",
    channelUrl: "https://www.youtube.com/@TheWildGamer95",
  },
  "destiny-2": {
    videoId: "VI0aooqx65s",
    title: "Destiny 2: película completa en español",
    channelName: "Kratosworld",
    channelUrl: "https://www.youtube.com/@Kratosworld",
    startAt: 5802,
  },
};

interface TimelineArchiveProps {
  releases: LoreGroup[];
  books: LoreGroup[];
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
        {orderedReleases.map((release) => {
          const slug = release.releaseSlug;
          const releaseBooks = slug ? booksByRelease.get(slug) ?? [] : [];
          const storyVideo = slug ? STORY_VIDEO_BY_RELEASE[slug] : undefined;

          return (
            <article className="timeline-event" key={release.id}>
              <span className="timeline-marker" aria-hidden="true" />
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
                {storyVideo && (
                  <div className="timeline-release-video">
                    <span className="eyebrow">
                      HISTORIA COMPLETA · {release.sourceGame === "destiny1" ? "DESTINY" : "DESTINY 2"}
                    </span>
                    <div className="timeline-release-video-frame">
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={`https://www.youtube-nocookie.com/embed/${storyVideo.videoId}${storyVideo.startAt ? `?start=${storyVideo.startAt}` : ""}`}
                        title={storyVideo.title}
                      />
                    </div>
                    <p>
                      Vídeo por{" "}
                      <a href={storyVideo.channelUrl} rel="noreferrer" target="_blank">{storyVideo.channelName}</a>.
                      {" "}¡Gracias por compartir este recorrido!
                    </p>
                  </div>
                )}
                {releaseBooks.length > 0 && (
                  <div className="timeline-books">
                    <span className="eyebrow">LIBROS DE ESTA ETAPA</span>
                    <div>
                      {releaseBooks
                        .filter((book) => !search || normalize(`${book.title} ${book.titleEn}`).includes(normalize(search)))
                        .map((book) => (
                        <a href={pathForGroup(book)} key={book.id} onClick={(event) => followInternalLink(event, () => onOpenGroup(book))}>
                          {book.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {release.lorePreview.length > 0 && (
                  <div className="timeline-lore">
                    <span className="eyebrow">RELATOS DESTACADOS DE BUNGIE</span>
                    <div>
                      {release.lorePreview.map((entry) => (
                        <a
                          href={`/${entry.sourceGame === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}/carta/${entry.id}`}
                          key={entry.id}
                          onClick={(event) => followInternalLink(event, () => onOpenLore(entry.id))}
                        >
                          {entry.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <a
                  className="timeline-open-release"
                  href={pathForGroup(release)}
                  onClick={(event) => followInternalLink(event, () => onOpenGroup(release))}
                >
                  ABRIR FICHA DEL LANZAMIENTO <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
