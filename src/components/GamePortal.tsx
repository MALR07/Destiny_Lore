import { useEffect, useState } from "react";
import { getLoreGroups } from "../lib/api";
import type { LoreGroup } from "../types/lore";
import { isBungieAsset } from "../lib/bungie-assets";
import { getReleaseIconUrl } from "../lib/release-icons";

interface GamePortalProps {
  game: "destiny1" | "destiny2";
  onBack: () => void;
  onOpenLore: () => void;
  onOpenMap: () => void;
  onOpenReleases: () => void;
  onOpenRaids: () => void;
  onOpenRelease: (group: LoreGroup) => void;
}

const GAME_COPY = {
  destiny1: {
    title: "Destiny",
    era: "EL GRIMORIO ORIGINAL",
    description: "Despierta en la Antigua Rusia y reconstruye los secretos de la Ciudad, la Colmena y el sistema solar.",
    mapLabel: "DESTINOS DE DESTINY",
  },
  destiny2: {
    title: "Destiny 2",
    era: "LA GUERRA POR LA LUZ",
    description: "Sigue la historia de la Vanguardia y explora mundos transformados por la Luz y la Oscuridad.",
    mapLabel: "DESTINOS DE DESTINY 2",
  },
} as const;

export default function GamePortal({
  game,
  onBack,
  onOpenLore,
  onOpenMap,
  onOpenReleases,
  onOpenRaids,
  onOpenRelease,
}: GamePortalProps) {
  const [releases, setReleases] = useState<LoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const copy = GAME_COPY[game];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getLoreGroups("release", "", controller.signal)
      .then((items) => setReleases(items.filter((item) => item.sourceGame === game)))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "No se pudieron cargar las expansiones.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [game]);

  return (
    <section className={`game-hub game-hub-${game}`} id="archivo">
      <button className="game-hub-back" onClick={onBack} type="button">← VOLVER AL ARCHIVO</button>
      <header className="game-hub-heading">
        <span className="eyebrow">{copy.era} · ARCHIVO DEL VIAJERO</span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </header>

      <div className="game-hub-routes">
        <button className="game-hub-route" onClick={onOpenLore} type="button">
          <span className="game-route-icon" aria-hidden="true">⌕</span>
          <span className="eyebrow">LECTURA Y BÚSQUEDA</span>
          <strong>{game === "destiny1" ? "Grimorio" : "Relatos y códice"}</strong>
          <span>Textos y registros narrativos propios de {copy.title}.</span>
          <i aria-hidden="true">ABRIR ARCHIVO ↗</i>
        </button>
        <button className="game-hub-route game-hub-map-route" onClick={onOpenMap} type="button">
          <span className="game-route-icon" aria-hidden="true">✧</span>
          <span className="eyebrow">ATLAS INTERACTIVO</span>
          <strong>Mapa estelar</strong>
          <span>{copy.mapLabel}; elige un destino para ver su imagen y abrir su ficha.</span>
          <i aria-hidden="true">EXPLORAR DESTINOS ↗</i>
        </button>
        <button className="game-hub-route" onClick={onOpenRaids} type="button">
          <span className="game-route-icon" aria-hidden="true">✧</span>
          <span className="eyebrow">ACTIVIDADES DE SEIS GUARDIANES</span>
          <strong>Raids</strong>
          <span>Consulta las incursiones y accede al archivo de su expansión.</span>
          <i aria-hidden="true">VER INCURSIONES ↗</i>
        </button>
      </div>

      <div className="game-release-heading">
        <div>
          <span className="eyebrow">CRONOLOGÍA DE CONTENIDO</span>
          <h3>Expansiones y lanzamientos</h3>
        </div>
        <button className="text-link" onClick={onOpenReleases} type="button">VER TODOS →</button>
      </div>
      {error && <p className="game-hub-error" role="alert">{error}</p>}
      {loading ? (
        <p className="game-hub-loading">RECUPERANDO LOS REGISTROS…</p>
      ) : (
        <div className="game-release-grid">
          {releases.map((release) => {
            const artwork = release.releaseImageKind === "artwork" && isBungieAsset(release.releaseImageUrl)
              ? release.releaseImageUrl
              : null;
            const icon = getReleaseIconUrl(release.releaseSlug)
              ?? (release.releaseImageKind === "icon" && isBungieAsset(release.releaseImageUrl)
                ? release.releaseImageUrl
                : null);
            return (
              <button
                className="game-release-card"
                key={release.id}
                onClick={() => onOpenRelease(release)}
                type="button"
                aria-label={`Abrir la ficha de ${release.title}`}
              >
                {artwork && (
                  <img
                    alt=""
                    className="game-release-art"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                    src={artwork}
                  />
                )}
                {icon && (
                  <img
                    alt=""
                    className={`game-release-icon${artwork ? " game-release-icon-mark" : ""}`}
                    loading="lazy"
                    src={icon}
                  />
                )}
                <span className="eyebrow">{release.releaseNumber ? `LANZAMIENTO ${release.releaseNumber}` : "LANZAMIENTO"}</span>
                <strong>{release.title}</strong>
                <span>{release.localEntryCount.toLocaleString("es-ES")} relatos · {(release.catalogItemCount ?? 0).toLocaleString("es-ES")} objetos</span>
                <i aria-hidden="true">VER EXPANSIÓN Y CONTENIDO ↗</i>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
