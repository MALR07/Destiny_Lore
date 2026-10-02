import type { LoreEntry } from "../types/lore";
import { decodeHtmlEntities, stripHtmlMarkup } from "../lib/text";

interface LoreCardProps {
  entry: LoreEntry;
  onSelect: (entry: LoreEntry) => void;
}

export default function LoreCard({ entry, onSelect }: LoreCardProps) {
  const cleanLoreText = (text: string) => entry.sourceGame === "destiny1"
    ? stripHtmlMarkup(text)
    : decodeHtmlEntities(text);
  const excerpt = cleanLoreText(entry.contentEs || entry.contentEn);

  return (
    <button className={`lore-card${entry.imageUrl ? " has-artwork" : ""}`} onClick={() => onSelect(entry)} type="button">
      <span className="card-topline">
        <span className="card-kicker">
          {entry.sourceGame === "destiny1" ? "GRIMORIO · DESTINY 1" : "REGISTRO · DESTINY 2"}
        </span>
        <span className="card-arrow" aria-hidden="true">↗</span>
      </span>
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
      <span className="card-title">{cleanLoreText(entry.title)}</span>
      {entry.subtitle && <span className="card-subtitle">{cleanLoreText(entry.subtitle)}</span>}
      <span className="card-excerpt">{excerpt}</span>
      <span className="card-footer">
        <span>{entry.contentEs ? "ESPAÑOL OFICIAL" : "ORIGINAL · INGLÉS"}</span>
        <span>{entry.cinematics.length > 0 ? "◉  CON VÍDEO" : "LEER RELATO"}</span>
      </span>
    </button>
  );
}
