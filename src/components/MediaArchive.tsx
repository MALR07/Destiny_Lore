import { useMemo, useState } from "react";
import type { MediaEntry } from "../data/media";
import { isBungieAsset } from "../lib/bungie-assets";

interface MediaArchiveProps {
  entries: MediaEntry[];
  search: string;
  layout?: "cards" | "selector";
}

function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "youtu.be") return url.pathname.slice(1).match(/^[\w-]{11}$/)?.[0] ?? null;
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) return null;
    const id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/embed\/([\w-]{11})$/)?.[1];
    return id?.match(/^[\w-]{11}$/) ? id : null;
  } catch {
    return null;
  }
}

function imageSource(value: string): string | null {
  if (/^\/media\/[a-z0-9/_-]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(value)) return value;
  return isBungieAsset(value) ? value : null;
}

function isLocalVideo(value: string): boolean {
  return /^\/media\/[a-z0-9/_-]+\.(?:m4v|mp4|ogv|ogg|webm)$/i.test(value);
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
}

function validEntry(entry: MediaEntry): boolean {
  return entry.kind === "video"
    ? Boolean(youtubeId(entry.url)) || isLocalVideo(entry.url)
    : Boolean(imageSource(entry.url));
}

export default function MediaArchive({ entries, search, layout = "cards" }: MediaArchiveProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visible = useMemo(() => {
    const query = normalize(search);
    const matches = entries.filter((entry) =>
      (!query || normalize(`${entry.title} ${entry.release ?? ""} ${entry.description ?? ""}`).includes(query))
      && validEntry(entry),
    );
    return layout === "selector" ? matches.filter((entry) => entry.kind === "video") : matches;
  }, [entries, layout, search]);

  const invalidCount = entries.length - entries.filter(validEntry).length;
  const selected = visible.find((entry) => entry.id === selectedId) ?? visible[0];
  if (visible.length === 0) {
    return (
      <div className="state-panel">
        <span className="state-symbol">◈</span>
        <div>
          <strong>{invalidCount ? "Hay entradas multimedia con enlaces no válidos" : "El archivo multimedia está listo para recibir material"}</strong>
          <p>
            Añade vídeos o imágenes en <code>src/data/media.ts</code>. Las fotos locales van en <code>public/media</code>.
          </p>
        </div>
      </div>
    );
  }

  if (layout === "selector") {
    const videoId = selected.kind === "video" ? youtubeId(selected.url) : null;
    const localVideo = selected.kind === "video" && !videoId && isLocalVideo(selected.url);
    return (
      <div className="media-selector">
        <div className="media-selector-buttons" aria-label="Vídeos del lanzamiento" role="group">
          {visible.map((entry) => (
            <button
              aria-pressed={selected.id === entry.id}
              className={selected.id === entry.id ? "media-selector-active" : ""}
              key={entry.id}
              onClick={() => setSelectedId(entry.id)}
              type="button"
            >
              {entry.title}
            </button>
          ))}
        </div>
        <div className="media-selector-player">
          {videoId ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={selected.title}
            />
          ) : localVideo ? (
            <video controls preload="metadata" src={selected.url}>
              Tu navegador no puede reproducir este vídeo.
            </video>
          ) : null}
        </div>
        {selected.description && <p className="media-selector-description">{selected.description}</p>}
        {invalidCount > 0 && (
          <p className="media-validation-note" role="status">
            Se han omitido {invalidCount} entradas con enlaces no válidos.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="media-grid">
      {invalidCount > 0 && (
        <p className="media-validation-note" role="status">
          Se han omitido {invalidCount} entradas con enlaces no válidos.
        </p>
      )}
      {visible.map((entry) => {
        const video = entry.kind === "video" ? youtubeId(entry.url) : null;
        const localVideo = entry.kind === "video" && !video && isLocalVideo(entry.url);
        return (
          <article className="media-card" key={entry.id}>
            <div className="media-frame">
              {video ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={`https://www.youtube-nocookie.com/embed/${video}`}
                  title={entry.title}
                />
              ) : localVideo ? (
                <video controls preload="metadata" src={entry.url}>
                  Tu navegador no puede reproducir este vídeo.
                </video>
              ) : (
                <img alt={entry.title} loading="lazy" src={imageSource(entry.url) ?? undefined} />
              )}
            </div>
            <div className="media-card-copy">
              {entry.release && <span className="eyebrow">{entry.release}</span>}
              <h3>{entry.title}</h3>
              {entry.description && <p>{entry.description}</p>}
              {entry.credit && <small>{entry.credit}</small>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
