import { decodeHtmlEntities } from "../lib/text";
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
}

export default function CatalogReader({ entry, onClose }: CatalogReaderProps) {
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
          {(entry.iconUrl || entry.imageUrl) && (
            <img
              alt=""
              className={`reader-artwork${entry.iconUrl || entry.imageKind === "icon" ? " reader-artwork-icon" : ""}`}
              onError={(event) => { event.currentTarget.hidden = true; }}
              src={entry.iconUrl ?? entry.imageUrl ?? undefined}
            />
          )}
          <span className="eyebrow">
            {[entry.itemType ?? CATEGORY_LABELS[entry.category], entry.rarity, entry.sourceGame === "destiny1" ? "DESTINY 1" : "DESTINY 2"]
              .filter(Boolean).join(" · ")}
          </span>
          <h2 id="catalog-reader-title">{decodeHtmlEntities(entry.title)}</h2>
          <div className="reader-rule" />
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
          ) : (
            <>
              <p className="reader-text">{decodeHtmlEntities(entry.summaryEs)}</p>
              <p className="translation-note">Resumen informativo del Archivo del Viajero; esta entrada no incluye una descripción en el manifiesto consultado.</p>
            </>
          )}
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
