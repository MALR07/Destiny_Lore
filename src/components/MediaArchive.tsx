import { useMemo } from "react";
import type { MediaEntry } from "../data/media";
import { isBungieAsset } from "../lib/bungie-assets";

interface MediaArchiveProps {
  entries: MediaEntry[];
  search: string;
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

export default function MediaArchive({ entries, search }: MediaArchiveProps) {
  const visible = useMemo(() => {
    const query = normalize(search);
    return entries.filter((entry) =>
      (!query || normalize(`${entry.title} ${entry.release ?? ""} ${entry.description ?? ""}`).includes(query))
      && validEntry(entry),
    );
  }, [entries, search]);

  const invalidCount = entries.length - entries.filter(validEntry).length;
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
