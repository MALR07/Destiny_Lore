import { decodeHtmlEntities } from "../lib/text";
import type { CatalogEntry } from "../types/lore";

const CLASS_NAMES: Record<number, string> = {
  0: "TITÁN",
  1: "CAZADOR",
  2: "HECHICERO",
  3: "TODAS LAS CLASES",
};

interface EquipmentTileProps {
  entry: CatalogEntry;
  onSelect: (entry: CatalogEntry) => void;
}

export default function EquipmentTile({ entry, onSelect }: EquipmentTileProps) {
  const imageUrl = entry.iconUrl ?? entry.imageUrl;
  const rarity = entry.rarity?.toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-") ?? "unknown";
  return (
    <button
      aria-label={`${entry.title}${entry.rarity ? `, ${entry.rarity}` : ""}${entry.classType != null ? `, ${CLASS_NAMES[entry.classType]}` : ""}`}
      className={`equipment-tile rarity-${rarity}`}
      onClick={() => onSelect(entry)}
      type="button"
    >
      <span className="equipment-tile-icon">
        {imageUrl && (
          <img
            alt=""
            loading="lazy"
            onError={(event) => { event.currentTarget.hidden = true; }}
            src={imageUrl}
          />
        )}
      </span>
      <span className="equipment-tile-name">{decodeHtmlEntities(entry.title)}</span>
      <span className="equipment-tile-meta">
        {entry.rarity ?? entry.itemType ?? (entry.category === "weapons" ? "ARMA" : "EQUIPO")}
        {entry.classType != null && entry.classType < 3 ? ` · ${CLASS_NAMES[entry.classType]}` : ""}
      </span>
    </button>
  );
}
