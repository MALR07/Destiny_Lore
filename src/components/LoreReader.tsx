import { useEffect, useState } from "react";
import { getLoreReferences, translateLore } from "../lib/api";
import { decodeHtmlEntities, stripHtmlMarkup } from "../lib/text";
import type { LoreEntry, LoreReference } from "../types/lore";

interface LoreReaderProps {
  entry: LoreEntry;
  onClose: () => void;
  onOpenReference: (reference: LoreReference) => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderLoreText(
  text: string,
  references: LoreReference[],
  onOpenReference: (reference: LoreReference) => void,
) {
  const nameCounts = new Map<string, number>();
  for (const reference of references) {
    const name = reference.matchedName.toLocaleLowerCase("es");
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  const ordered = references
    .filter((reference) => nameCounts.get(reference.matchedName.toLocaleLowerCase("es")) === 1)
    .sort((left, right) => right.matchedName.length - left.matchedName.length);
  if (ordered.length === 0) return text;

  const referenceByName = new Map(
    ordered.map((reference) => [reference.matchedName.toLocaleLowerCase("es"), reference]),
  );
  const pattern = new RegExp(`(${ordered.map((reference) => escapeRegExp(reference.matchedName)).join("|")})`, "giu");
  return text.split(pattern).map((part, index) => {
    const reference = referenceByName.get(part.toLocaleLowerCase("es"));
    if (!reference) return part;
    return (
      <button
        className="lore-inline-reference"
        key={`${reference.kind}-${reference.id}-${index}`}
        onClick={() => onOpenReference(reference)}
        type="button"
      >
        {part}
      </button>
    );
  });
}

function getYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    let videoId: string | null = null;
    if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      videoId = url.searchParams.get("v") ?? url.pathname.split("/").pop() ?? null;
    }
    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export default function LoreReader({ entry, onClose, onOpenReference }: LoreReaderProps) {
  const cleanLoreText = (text: string) => entry.sourceGame === "destiny1"
    ? stripHtmlMarkup(text)
    : decodeHtmlEntities(text);
  const [title, setTitle] = useState(cleanLoreText(entry.title));
  const [contentEs, setContentEs] = useState(entry.contentEs ? cleanLoreText(entry.contentEs) : null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [references, setReferences] = useState<LoreReference[]>([]);
  const [referencesError, setReferencesError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setReferences([]);
    setReferencesError(null);
    getLoreReferences(entry.id, controller.signal)
      .then(setReferences)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setReferencesError(error instanceof Error ? error.message : "No se pudieron cargar las referencias.");
      });
    return () => controller.abort();
  }, [entry.id]);

  useEffect(() => {
    setTitle(cleanLoreText(entry.title));
    setContentEs(entry.contentEs ? cleanLoreText(entry.contentEs) : null);
    setTranslationError(null);
    if (entry.contentEs || !entry.contentEn) return;

    let active = true;
    setTranslating(true);
    translateLore(entry.id)
      .then(({ titleEs, contentEs: translated }) => {
        if (active) {
          setTitle(titleEs);
          setContentEs(translated);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTranslationError(
            error instanceof Error ? error.message : "No se pudo traducir este relato.",
          );
        }
      })
      .finally(() => {
        if (active) setTranslating(false);
      });
    return () => {
      active = false;
    };
  }, [entry]);

  const embedUrls = entry.cinematics
    .map((cinematic) => ({ ...cinematic, embedUrl: getYouTubeEmbedUrl(cinematic.youtubeUrl) }))
    .filter((cinematic) => cinematic.embedUrl !== null);

  return (
    <div className="reader-backdrop" onMouseDown={onClose}>
      <article
        aria-labelledby="reader-title"
        aria-modal="true"
        className="reader-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="reader-topbar">
          <span>
            ARCHIVO DEL VIAJERO <span className="reader-separator">/</span>
            {entry.sourceGame === "destiny1" ? " GRIMORIO D1" : " LORE D2"}
          </span>
          <button className="reader-close" onClick={onClose} type="button" aria-label="Cerrar">
            CERRAR <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="reader-content">
          {entry.imageUrl && (
            <img
              alt=""
              className={`reader-artwork${entry.imageKind === "icon" ? " reader-artwork-icon" : ""}`}
              onError={(event) => { event.currentTarget.hidden = true; }}
              src={entry.imageUrl}
            />
          )}
          <span className="eyebrow">REGISTRO DEL GRIMORIO</span>
          <h2 id="reader-title">{title}</h2>
          {entry.subtitle && <p className="reader-subtitle">{cleanLoreText(entry.subtitle)}</p>}
          <div className="reader-rule" />
          {contentEs ? (
            <p className="reader-text">{renderLoreText(contentEs, references, onOpenReference)}</p>
          ) : (
            <>
              <p className="reader-text english-text">
                {renderLoreText(cleanLoreText(entry.contentEn), references, onOpenReference)}
              </p>
              {translating && <p className="translation-status">Preparando traducción localizada…</p>}
              {translationError && (
                <p className="translation-error">
                  {translationError} Se muestra el texto original mientras tanto.
                </p>
              )}
            </>
          )}
          <p className="translation-note">
            {entry.contentEs
              ? "Texto en español del manifiesto oficial de Bungie."
              : "Texto original del manifiesto en inglés."}
          </p>
          {entry.sourceUrl && (
            <a className="source-link" href={entry.sourceUrl} rel="noreferrer" target="_blank">
              ABRIR FUENTE OFICIAL DE BUNGIE ↗
            </a>
          )}
          {(references.length > 0 || referencesError) && (
            <section className="lore-reference-section" aria-label="Referencias relacionadas">
              <div className="section-heading">
                <span className="eyebrow">REFERENCIAS EN ESTE RELATO</span>
                <span className="section-line" />
              </div>
              {referencesError ? (
                <p className="translation-error">{referencesError}</p>
              ) : (
                <div className="lore-reference-list">
                  {references.map((reference) => (
                    <button
                      className="lore-reference-chip"
                      key={`${reference.kind}-${reference.id}`}
                      onClick={() => onOpenReference(reference)}
                      type="button"
                    >
                      {decodeHtmlEntities(reference.title)}
                      <span>{reference.kind === "lore" ? "RELATO" : reference.category?.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
          <section className="cinematic-section">
            <div className="section-heading">
              <span className="eyebrow">PARA VER Y ESCUCHAR</span>
              <span className="section-line" />
            </div>
            {embedUrls.length ? (
              <div className="cinematic-grid">
                {embedUrls.map((cinematic) => (
                  <div className="cinematic-card" key={cinematic.id}>
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      src={cinematic.embedUrl ?? undefined}
                      title={cinematic.title}
                    />
                    <span>{cinematic.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-cinematics">
                Aún no hay vídeos en español verificados para este relato. Añadiremos únicamente
                material revisado y contextualizado.
              </p>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
