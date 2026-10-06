import { decodeHtmlEntities } from "../lib/text";
import { getDestinationArtworkUrl, getDestinationLore } from "../data/destination-artwork";
import type { CatalogEntry } from "../types/lore";

const CATEGORY_LABELS: Record<CatalogEntry["category"], string> = {
  weapons: "ARMA",
  armor: "ARMADURA",
  characters: "PERSONAJE",
  places: "LUGAR",
  species: "PUEBLO O CLASE",
  factions: "FACCION",
  objects: "OBJETO",
};

interface CatalogReaderProps {
  entry: CatalogEntry;
  onClose: () => void;
  largeArtwork?: boolean;
}

export default function CatalogReader({ entry, onClose, largeArtwork = false }: CatalogReaderProps) {
  const destinationArtwork = getDestinationArtworkUrl(entry);
  const destinationLore = getDestinationLore(entry);
  const fallbackArtwork = destinationArtwork
    ? null
    : largeArtwork
      ? entry.imageUrl ?? entry.iconUrl
      : entry.iconUrl ?? entry.imageUrl;
  const description = entry.descriptionEs ?? entry.descriptionEn;
  const descriptionLanguage = entry.descriptionEs ? "es" : entry.descriptionEn ? "en" : null;
  const flavorText = entry.flavorTextEs ?? entry.flavorTextEn;
  const flavorLanguage = entry.flavorTextEs ? "es" : entry.flavorTextEn ? "en" : null;
  const hasDuplicateFlavorText = Boolean(description && flavorText && description === flavorText);

  return (
    <div className="reader-backdrop" onMouseDown={onClose}>
      <article
        aria-labelledby="catalog-reader-title"
        aria-modal="true"
        className="reader-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="reader-topbar">
          <span>ARCHIVO DEL VIAJERO <span className="reader-separator">/</span> FICHA DE REFERENCIA</span>
          <button className="reader-close" onClick={onClose} type="button" aria-label="Cerrar">
            CERRAR <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="reader-content">
          {(destinationArtwork || fallbackArtwork) && (
            <img
              alt=""
              className={`reader-artwork${largeArtwork ? " reader-artwork-equipment" : destinationArtwork ? " reader-artwork-location" : entry.iconUrl || entry.imageKind === "icon" ? " reader-artwork-icon" : ""}`}
              onError={(event) => {
                if (fallbackArtwork && event.currentTarget.getAttribute("src") !== fallbackArtwork) {
                  event.currentTarget.src = fallbackArtwork;
                } else {
                  event.currentTarget.hidden = true;
                }
              }}
              src={destinationArtwork ?? fallbackArtwork ?? undefined}
            />
          )}
          <span className="eyebrow">
            {[entry.itemType ?? CATEGORY_LABELS[entry.category], entry.rarity, entry.sourceGame === "destiny1" ? "DESTINY 1" : "DESTINY 2"]
              .filter(Boolean).join(" · ")}
          </span>
          <h2 id="catalog-reader-title">{decodeHtmlEntities(entry.title)}</h2>
          <div className="reader-rule" />
          {destinationLore && (
            <>
              <span className="catalog-reader-label">CONTEXTO DEL DESTINO</span>
              <p className="reader-text">{destinationLore.summary}</p>
              <p className="translation-note">
                Síntesis propia basada en{" "}
                <a href={destinationLore.sourceUrl} rel="noreferrer" target="_blank">Destinypedia ↗</a>
              </p>
            </>
          )}
          {description ? (
            <>
              <span className="catalog-reader-label">DESCRIPCIÓN</span>
              <p className="reader-text">{decodeHtmlEntities(description)}</p>
              <p className="translation-note">
                {descriptionLanguage === "es"
                  ? "Texto localizado del manifiesto oficial en español."
                  : "Texto disponible únicamente en inglés en los manifiestos consultados."}
              </p>
            </>
          ) : !destinationLore ? (
            <>
              <p className="reader-text">{decodeHtmlEntities(entry.summaryEs)}</p>
              <p className="translation-note">Resumen informativo del Archivo del Viajero; esta entrada no incluye una descripción en el manifiesto consultado.</p>
            </>
          ) : null}
          {flavorText && !hasDuplicateFlavorText && (
            <>
              <span className="catalog-reader-label">TEXTO DE AMBIENTACIÓN</span>
              <p className="reader-text">{decodeHtmlEntities(flavorText)}</p>
              <p className="translation-note">
                {flavorLanguage === "es"
                  ? "Texto localizado del manifiesto oficial en español."
                  : "Texto disponible únicamente en inglés en los manifiestos consultados."}
              </p>
            </>
          )}
          {entry.sourceUrl && (
            <a className="source-link" href={entry.sourceUrl} rel="noreferrer" target="_blank">
              ABRIR FUENTE OFICIAL DE BUNGIE ↗
            </a>
          )}
        </div>
      </article>
    </div>
  );
}
