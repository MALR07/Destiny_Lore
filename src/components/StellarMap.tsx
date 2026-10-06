import { useEffect, useState } from "react";
import { getCatalog } from "../lib/api";
import { isBungieAsset } from "../lib/bungie-assets";
import { decodeHtmlEntities } from "../lib/text";
import ApiLoading from "./ApiLoading";
import {
  DESTINY2_MAP_LOCATIONS,
  getDestinationArtworkUrl,
  getDestinationDescription,
  getDestiny2MapLocation,
  isDestinationActivity,
  isExcludedDestination,
} from "../data/destination-artwork";
import type { CatalogEntry, CatalogPage } from "../types/lore";

interface StellarMapProps {
  game: "destiny1" | "destiny2";
  onBack: () => void;
  onOpenLocation: (entry: CatalogEntry) => void;
}

const PAGE_SIZE = 24;
const CHART_HOTSPOTS = [
  { label: "Cosmódromo", aliases: ["cosmodrome", "old russia", "perimeter of the city"], left: 50, top: 72 },
  { label: "Venus", aliases: ["venus", "ishtar"], left: 31, top: 22 },
  { label: "Arrecife", aliases: ["reef", "arrecife"], left: 11, top: 43 },
  { label: "Luna", aliases: ["moon", "luna"], left: 27, top: 58 },
  { label: "Torre", aliases: ["tower", "torre"], left: 50, top: 48 },
  { label: "Marte", aliases: ["mars", "marte"], left: 84, top: 43 },
  { label: "Saturno", aliases: ["saturn", "saturno"], left: 82, top: 68 },
] as const;

const FEATURE_CARDS = [
  {
    title: "Crisol",
    detail: "Combate entre Guardianes",
    image: "/media/site-art/destinos/destiny1/crisol.jpg",
  },
  {
    title: "Vanguardia",
    detail: "La Torre y sus Guardianes",
    image: "/media/site-art/destinos/destiny1/vanguardia.png",
  },
  {
    title: "Pruebas de Osiris",
    detail: "El Faro aguarda a los mejores equipos",
    image: "/media/site-art/destinos/destiny1/osiris.jpg",
  },
] as const;

function normalizeLocationTitle(title: string): string {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function StellarMap({ game, onBack, onOpenLocation }: StellarMapProps) {
  const [locations, setLocations] = useState<CatalogEntry[]>([]);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mappedDestinations = DESTINY2_MAP_LOCATIONS.map((destination) => {
    const entry = locations.find((location) =>
      getDestiny2MapLocation(`${location.title} ${location.titleEn}`)?.id === destination.id,
    ) ?? null;
    const manifestArtworkUrl = entry?.imageKind === "artwork" && isBungieAsset(entry.imageUrl)
      ? entry.imageUrl
      : null;
    const iconUrl = entry?.iconUrl && isBungieAsset(entry.iconUrl)
      ? entry.iconUrl
      : entry?.imageKind === "icon" && isBungieAsset(entry.imageUrl) ? entry.imageUrl : null;
    const catalogEntry: CatalogEntry = entry ?? {
      id: `destination-${destination.id}`,
      sourceGame: "destiny2",
      category: "places",
      title: destination.title,
      titleEn: destination.title,
      summaryEs: destination.summary,
      descriptionEn: null,
      descriptionEs: null,
      flavorTextEn: null,
      flavorTextEs: null,
      imageUrl: null,
      imageKind: null,
      rarity: null,
      classType: null,
      itemType: null,
      iconUrl: null,
      sourceUrl: null,
    };
    return {
      ...destination,
      entry,
      catalogEntry,
      artworkUrl: destination.artworkUrl ?? manifestArtworkUrl,
      fallbackArtwork: destination.artworkUrl ? manifestArtworkUrl ?? iconUrl : iconUrl,
      iconUrl,
    };
  });
  const selectedMapDestination = mappedDestinations.find((item) => item.id === selectedDestinationId);
  const locationCards = game === "destiny2"
    ? mappedDestinations.map((destination) => ({
      id: destination.id,
      entry: destination.catalogEntry,
      title: destination.title,
      summary: destination.summary,
      era: destination.era,
      artwork: destination.artworkUrl,
      fallbackArtwork: destination.fallbackArtwork,
      icon: destination.iconUrl,
      gameLabel: destination.era === "actual" ? "DESTINY 2 · ACTUAL" : "DESTINY 2 · LEGADO",
    }))
    : locations.map((location) => ({
      id: location.id,
      entry: location,
      title: decodeHtmlEntities(location.title),
      summary: getDestinationDescription(location),
      era: null,
      artwork: getDestinationArtworkUrl(location)
        ?? (location.imageKind === "artwork" && isBungieAsset(location.imageUrl) ? location.imageUrl : null),
      fallbackArtwork: getDestinationArtworkUrl(location)
        ? location.imageKind === "artwork" && isBungieAsset(location.imageUrl) ? location.imageUrl : null
        : null,
      icon: null,
      gameLabel: location.sourceGame === "destiny1" ? "DESTINY" : "DESTINY 2",
    }));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSelected(null);
    setSelectedDestinationId(null);
    getCatalog("", 1, game, "places", controller.signal)
      .then(async (firstPage: CatalogPage) => {
        const pageCount = Math.ceil(firstPage.total / PAGE_SIZE);
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            getCatalog("", index + 2, game, "places", controller.signal),
          ),
        );
        if (controller.signal.aborted) return;
        setLocations(
          [firstPage, ...remainingPages]
            .flatMap((page) => page.items)
            .filter((location) => !isDestinationActivity(location) && !isExcludedDestination(location)),
        );
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "No se pudieron cargar los destinos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [game]);

  return (
    <section className="stellar-map-section" id="archivo">
      <button className="game-hub-back" onClick={onBack} type="button">← VOLVER A {game === "destiny1" ? "DESTINY" : "DESTINY 2"}</button>
      <header className="stellar-map-heading">
        <span className="eyebrow">CARTOGRAFÍA DEL GUARDIÁN · {game === "destiny1" ? "DESTINY" : "DESTINY 2"}</span>
        <h2>Mapa estelar</h2>
        <p>
          {game === "destiny2"
            ? "Explora los mundos del sistema y selecciona un punto para ver su historia, imagen y ficha del catálogo."
            : "Selecciona un destino del mapa para consultar su imagen y abrir la ficha del lugar."}
        </p>
      </header>

      {error && <div className="state-panel error-panel" role="alert"><strong>No se pudo cargar el mapa</strong><p>{error}</p></div>}
      {loading ? (
        <ApiLoading message="Sincronizando destinos con el catálogo…" />
      ) : !error && locations.length === 0 && game === "destiny1" ? (
        <div className="state-panel"><strong>No hay destinos en este catálogo</strong><p>Sincroniza los lugares del manifiesto de este juego para poblar el mapa.</p></div>
      ) : (
        <>
          <div className="stellar-map-layout">
            <div className={`stellar-canvas${game === "destiny1" || game === "destiny2" ? " stellar-canvas-chart" : ""}${game === "destiny2" ? " stellar-canvas-destiny2" : ""}`} aria-label="Mapa interactivo de destinos">
              {game === "destiny1" ? (
                <>
                  <img
                    alt="Carta estelar de Destiny con la Tierra, la Luna, Venus, Marte y el Arrecife"
                    className="stellar-chart-image"
                    loading="lazy"
                    src="/media/site-art/mapas/destiny1/solar-system-map.jpg"
                  />
                  <div className="stellar-chart-credit">
                    CARTA ESTELAR ORIGINAL DE DESTINY · BUNGIE
                    <a href="https://www.destinypedia.com/File:Destiny-solar-system-map.png" rel="noreferrer" target="_blank">
                      FUENTE ↗
                    </a>
                  </div>
                  {CHART_HOTSPOTS.map((hotspot) => {
                    const location = locations.find((entry) => {
                      const title = normalizeLocationTitle(entry.titleEn);
                      return hotspot.aliases.some((alias) => title.includes(alias));
                    });
                    if (!location) return null;
                    return (
                      <button
                        aria-pressed={selected?.id === location.id}
                        className={`stellar-node stellar-chart-node${hotspot.label === "Torre" ? " stellar-chart-node-tower" : ""}${selected?.id === location.id ? " stellar-node-active" : ""}`}
                        key={hotspot.label}
                        onClick={() => setSelected(location)}
                        style={{ left: `${hotspot.left}%`, top: `${hotspot.top}%` }}
                        title={decodeHtmlEntities(location.title)}
                        type="button"
                      >
                        {hotspot.label === "Torre" && getDestinationArtworkUrl(location) ? (
                          <img alt="" src={getDestinationArtworkUrl(location) ?? undefined} />
                        ) : (
                          <span aria-hidden="true">✦</span>
                        )}
                        <span className="visually-hidden">{decodeHtmlEntities(location.title)}</span>
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  <img
                    alt="Mapa de destinos de Destiny 2 con puntos interactivos"
                    className="stellar-chart-image"
                    src="/media/site-art/destinos/destiny2/d2%20mapa.jpg"
                  />
                  <div className="stellar-chart-credit">
                    MAPA DE DESTINOS DE DESTINY 2 · PUNTOS INTERACTIVOS
                  </div>
                  {mappedDestinations.map((destination) => {
                    if (!destination.showOnMap || destination.left === null || destination.top === null) return null;
                    return (
                      <button
                        aria-pressed={selectedDestinationId === destination.id}
                        className={`stellar-node stellar-destiny2-node${destination.era === "legado" ? " stellar-destiny2-node-legacy" : ""}${selectedDestinationId === destination.id ? " stellar-node-active" : ""}`}
                        key={destination.id}
                        onClick={() => {
                          setSelected(destination.catalogEntry);
                          setSelectedDestinationId(destination.id);
                        }}
                        style={{ left: `${destination.left}%`, top: `${destination.top}%` }}
                        title={destination.title}
                        aria-label={`${destination.title} · ${destination.era === "actual" ? "destino actual" : "destino del legado"}`}
                        type="button"
                      >
                        <span aria-hidden="true">✦</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            <aside className="stellar-location-panel" aria-live="polite">
              {game === "destiny2" && selectedMapDestination ? (
                <>
                  {selectedMapDestination.artworkUrl ? (
                    <img
                      alt={`Imagen de ${selectedMapDestination.title}`}
                      className="stellar-location-artwork"
                      loading="lazy"
                      onError={(event) => {
                        if (selectedMapDestination.fallbackArtwork
                          && event.currentTarget.getAttribute("src") !== selectedMapDestination.fallbackArtwork) {
                          event.currentTarget.src = selectedMapDestination.fallbackArtwork;
                          event.currentTarget.className = "stellar-location-icon stellar-location-icon-destination";
                        } else {
                          event.currentTarget.hidden = true;
                        }
                      }}
                      src={selectedMapDestination.artworkUrl}
                    />
                  ) : selectedMapDestination.iconUrl ? (
                    <img
                      alt=""
                      className="stellar-location-icon stellar-location-icon-destination"
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }}
                      src={selectedMapDestination.iconUrl}
                    />
                  ) : (
                    <div aria-hidden="true" className="stellar-location-placeholder">✦</div>
                  )}
                  <span className="eyebrow">
                    {selectedMapDestination.era === "actual" ? "DESTINO ACTUAL" : "DESTINO DEL LEGADO"}
                  </span>
                  <h3>{selectedMapDestination.title}</h3>
                  <p>{selectedMapDestination.summary}</p>
                  <button
                    className="hero-cta"
                    onClick={() => onOpenLocation(selectedMapDestination.catalogEntry)}
                    type="button"
                  >
                    ABRIR FICHA <span aria-hidden="true">↗</span>
                  </button>
                  {(selectedMapDestination.artworkUrl || selectedMapDestination.iconUrl) && (
                    <small className="stellar-image-credit">
                      {selectedMapDestination.artworkUrl?.startsWith("/media/site-art/destinos/destiny2/")
                        ? "IMAGEN LOCAL DEL DESTINO"
                        : "IMAGEN DEL MANIFIESTO · BUNGIE"}
                    </small>
                  )}
                </>
              ) : selected ? (
                <>
                  {(getDestinationArtworkUrl(selected) || (selected.imageKind === "artwork" && isBungieAsset(selected.imageUrl))) && (
                    <img
                      alt={`Imagen de ${decodeHtmlEntities(selected.title)}`}
                      className="stellar-location-artwork"
                      loading="lazy"
                      onError={(event) => {
                        const fallbackUrl = selected.imageKind === "artwork" && isBungieAsset(selected.imageUrl)
                          ? selected.imageUrl
                          : null;
                        if (fallbackUrl && event.currentTarget.getAttribute("src") !== fallbackUrl) {
                          event.currentTarget.src = fallbackUrl;
                        } else {
                          event.currentTarget.hidden = true;
                        }
                      }}
                      src={getDestinationArtworkUrl(selected) ?? selected.imageUrl ?? undefined}
                    />
                  )}
                  {game === "destiny2" && selected.imageKind === "icon" && isBungieAsset(selected.imageUrl) && (
                    <img
                      alt=""
                      className="stellar-location-icon"
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }}
                      src={selected.imageUrl}
                    />
                  )}
                  <span className="eyebrow">DESTINO REGISTRADO</span>
                  <h3>{decodeHtmlEntities(selected.title)}</h3>
                  <p>{getDestinationDescription(selected) ?? decodeHtmlEntities(selected.descriptionEs ?? selected.descriptionEn ?? selected.summaryEs)}</p>
                  <button
                    className="hero-cta"
                    onClick={() => onOpenLocation(selected)}
                    type="button"
                  >
                    ABRIR FICHA <span aria-hidden="true">↗</span>
                  </button>
                  {getDestinationArtworkUrl(selected) && (
                    <small className="stellar-image-credit">
                      {selected.sourceGame === "destiny2" ? "IMAGEN LOCAL DEL DESTINO" : "ARTE LOCAL DEL DESTINO"}
                    </small>
                  )}
                </>
              ) : game === "destiny2" ? (
                <>
                  <span className="eyebrow">EXPLORA EL SISTEMA</span>
                  <h3>Destinos de Destiny 2</h3>
                  <p>Selecciona un punto del mapa o una tarjeta para conocer el destino, su historia y las imágenes disponibles del manifiesto.</p>
                </>
              ) : (
                <>
                  <span className="eyebrow">SEÑAL DETECTADA</span>
                  <h3>Elige una localización</h3>
                  <p>El mapa reúne los destinos presentes en el manifiesto de Bungie para este juego.</p>
                </>
              )}
              <small>
                {game === "destiny2"
                  ? mappedDestinations.filter((destination) => destination.showOnMap).length
                  : locations.length} LOCALIZACIONES EN EL MAPA
              </small>
            </aside>
          </div>
          {game === "destiny2" && (
            <div className="stellar-map-legend" aria-label="Leyenda del mapa">
              <span><i aria-hidden="true" /> DESTINO ACTUAL</span>
              <span><i aria-hidden="true" /> DESTINO DEL LEGADO</span>
              <small>Los destinos del legado se consultan en las fichas inferiores.</small>
            </div>
          )}
          <div className={`stellar-location-grid${game === "destiny2" ? " stellar-location-grid-destiny2" : ""}`}>
            {locationCards.map((card) => {
              return (
                <button
                  aria-pressed={game === "destiny2"
                    ? selectedDestinationId === card.id
                    : selected?.id === card.id}
                  className={`stellar-location-card${game === "destiny2" ? " stellar-location-card-destiny2" : ""}${game === "destiny2" && !card.artwork ? " stellar-location-card-no-art" : ""}`}
                  key={card.id}
                  onClick={() => {
                    setSelected(card.entry);
                    setSelectedDestinationId(game === "destiny2" ? card.id : null);
                  }}
                  type="button"
                >
                  {card.artwork && (
                    <img
                      alt=""
                      className="stellar-location-card-artwork"
                      loading="lazy"
                      onError={(event) => {
                        if (card.fallbackArtwork && event.currentTarget.getAttribute("src") !== card.fallbackArtwork) {
                          event.currentTarget.src = card.fallbackArtwork;
                        } else {
                          event.currentTarget.hidden = true;
                        }
                      }}
                      src={card.artwork}
                    />
                  )}
                  {!card.artwork && card.icon && (
                    <img
                      alt=""
                      className="stellar-location-card-icon"
                      loading="lazy"
                      src={card.icon}
                    />
                  )}
                  <span>
                    <strong>{card.title}</strong>
                    <small>{card.gameLabel}</small>
                    {card.summary && <span className="stellar-location-card-summary">{card.summary}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {game === "destiny1" && (
            <section className="stellar-feature-section" aria-labelledby="stellar-feature-title">
              <div className="stellar-feature-heading">
                <span className="eyebrow">ACTIVIDADES · SIN MARCADOR EN LA CARTA</span>
                <h3 id="stellar-feature-title">La vida en la Torre</h3>
              </div>
              <div className="stellar-feature-grid">
                {FEATURE_CARDS.map((card) => (
                  <article className="stellar-feature-card" key={card.title}>
                    <img alt="" loading="lazy" src={card.image} />
                    <div>
                      <strong>{card.title}</strong>
                      <span>{card.detail}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
