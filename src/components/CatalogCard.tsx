import { decodeHtmlEntities } from "../lib/text";
import type { CatalogEntry } from "../types/lore";

const CATEGORY_LABELS: Record<CatalogEntry["category"], string> = {
  weapons: "ARMAMENTO",
  armor: "ARMADURA",
  characters: "PERSONAJES",
  places: "LUGARES",
  species: "PUEBLOS Y CLASES",
  factions: "FACCIONES",
  objects: "OBJETOS CON LORE",
};

interface CatalogCardProps {
  entry: CatalogEntry;
  onSelect: (entry: CatalogEntry) => void;
}

export default function CatalogCard({ entry, onSelect }: CatalogCardProps) {
  const preview = entry.descriptionEs ?? entry.flavorTextEs
    ?? entry.descriptionEn ?? entry.flavorTextEn ?? entry.summaryEs;
  const hasOfficialText = Boolean(
    entry.descriptionEs ?? entry.descriptionEn ?? entry.flavorTextEs ?? entry.flavorTextEn,
  );
  const hasEnglishFallback = !entry.descriptionEs && !entry.flavorTextEs
    && Boolean(entry.descriptionEn || entry.flavorTextEn);

  return (
    <button
      className={`lore-card catalog-card${entry.imageUrl ? " has-artwork" : ""}`}
      onClick={() => onSelect(entry)}
      type="button"
    >
      {entry.imageUrl && (
        <span className={`card-artwork${entry.imageKind === "icon" ? " card-artwork-icon" : ""}`}>
          <img
            alt=""
            loading="lazy"
            onError={(event) => { event.currentTarget.hidden = true; }}
            src={entry.imageUrl}
          />
        </span>
      )}
      <span className="card-topline">
        <span className="card-kicker">
          {CATEGORY_LABELS[entry.category]} · {entry.sourceGame === "destiny1" ? "DESTINY 1" : "DESTINY 2"}
        </span>
        <span className="card-arrow" aria-hidden="true">↗</span>
      </span>
      <span className="card-title">{decodeHtmlEntities(entry.title)}</span>
      <span className="card-excerpt">{decodeHtmlEntities(preview)}</span>
      <span className="card-footer">
        <span>{hasEnglishFallback ? "TEXTO OFICIAL EN INGLÉS" : hasOfficialText ? "TEXTO DEL MANIFIESTO" : "RESUMEN DEL ARCHIVO"}</span>
        <span>FICHA DE REFERENCIA</span>
      </span>
    </button>
  );
}
