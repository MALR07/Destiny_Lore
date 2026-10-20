import type { LoreGroup, LoreGroupType } from "../types/lore";
import { isBungieAsset } from "../lib/bungie-assets";
import { getReleaseIconUrl } from "../lib/release-icons";
import { getLoreBookCover } from "../lib/book-covers";
import { getReleaseDisplayTitle } from "../data/release-artwork";
import { followInternalLink } from "../lib/navigation";
import { pathForGroup } from "../lib/routes";

interface LoreGroupIndexProps {
  groups: LoreGroup[];
  type: LoreGroupType;
  onSelect: (group: LoreGroup) => void;
}

function releaseIcon(group: LoreGroup): string | null {
  return getReleaseIconUrl(group.releaseSlug);
}

export default function LoreGroupIndex({ groups, type, onSelect }: LoreGroupIndexProps) {
  if (type === "release") {
    const orderedReleases = [...groups].sort(
      (left, right) => (right.releaseOrder ?? 0) - (left.releaseOrder ?? 0),
    );
    return (
      <div className="group-index release-index">
        <div className="release-grid">
          {orderedReleases.map((group) => (
            <article className="release-card" key={group.id}>
              <a className="release-card-main" href={pathForGroup(group)} onClick={(event) => followInternalLink(event, () => onSelect(group))}>
                <strong className="release-index-name">{getReleaseDisplayTitle(group.releaseSlug, group.title)}</strong>
                <span className="release-index-docs">
                  {`${(group.catalogItemCount ?? 0).toLocaleString("es-ES")} objetos · ${group.localEntryCount.toLocaleString("es-ES")} relatos`}
                </span>
                {releaseIcon(group) && (
                  <span className="release-index-icon">
                    <img
                      alt=""
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }}
                      src={releaseIcon(group) ?? undefined}
                    />
                  </span>
                )}
                <span className="release-index-link">
                  Ver registros de {getReleaseDisplayTitle(group.releaseSlug, group.title)} →
                </span>
              </a>
            </article>
          ))}
        </div>
      </div>
    );
  }
  if (type === "book") {
    const releases = new Map<string, { title: string; iconUrl: string | null; groups: LoreGroup[] }>();
    for (const group of groups) {
      const key = group.releaseSlug ?? "unassigned";
      const section = releases.get(key) ?? {
        title: group.releaseTitle ?? "Sin lanzamiento asignado",
        iconUrl: getReleaseIconUrl(key)
          ?? (isBungieAsset(group.releaseImageUrl) ? group.releaseImageUrl : null),
        groups: [],
      };
      section.groups.push(group);
      releases.set(key, section);
    }

    return (
      <div className="group-index book-release-index">
        {[...releases.entries()].map(([slug, section]) => (
          <section className="book-release-section" key={slug}>
            <div className="book-release-heading">
              {section.iconUrl && (
                <img
                  alt=""
                  className="book-release-art"
                  loading="lazy"
                  onError={(event) => { event.currentTarget.hidden = true; }}
                  src={section.iconUrl}
                />
              )}
              <div>
                <span className="eyebrow">{slug === "unassigned" ? "PENDIENTE DE CLASIFICAR" : "LIBROS DEL LORE"}</span>
                <h3>{section.title}</h3>
              </div>
            </div>
            <div className="group-list">
              {section.groups.map((group) => (
                <a
                  className="group-index-item"
                  href={pathForGroup(group)}
                  key={group.id}
                  onClick={(event) => followInternalLink(event, () => onSelect(group))}
                >
                  {(getLoreBookCover(group.titleEn) || isBungieAsset(group.imageUrl)) && (
                    <img
                      alt=""
                      className={getLoreBookCover(group.titleEn) ? "book-cover-thumb" : undefined}
                      loading="lazy"
                      src={getLoreBookCover(group.titleEn) ?? group.imageUrl ?? undefined}
                    />
                  )}
                  <span><strong>{group.title}</strong></span>
                  <span className="group-count">
                    {group.localEntryCount > 0
                      ? `${group.localEntryCount.toLocaleString("es-ES")} RELATOS`
                      : "SIN RELATOS LOCALES"}
                    <i aria-hidden="true">↗</i>
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }
  return null;
}
