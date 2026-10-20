import type { LoreEntry } from "../types/lore";
import { followInternalLink } from "../lib/navigation";
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
    <a
      className={`lore-card${entry.imageUrl ? " has-artwork" : ""}${entry.sourceGame === "destiny1" ? " lore-card-d1" : ""}`}
      href={`/${entry.sourceGame === "destiny1" ? "destiny/grimorio" : "destiny2/relatos"}/carta/${entry.id}`}
      onClick={(event) => followInternalLink(event, () => onSelect(entry))}
    >
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
        <span>LEER RELATO</span>
      </span>
    </a>
  );
}
