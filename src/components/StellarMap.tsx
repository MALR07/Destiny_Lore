import { useEffect, useState } from "react";
import { getCatalog } from "../lib/api";
import { isBungieAsset } from "../lib/bungie-assets";
import { decodeHtmlEntities } from "../lib/text";
import type { CatalogEntry, CatalogPage } from "../types/lore";

interface StellarMapProps {
  game: "destiny1" | "destiny2";
  onBack: () => void;
  onOpenLocation: (entry: CatalogEntry) => void;
}

const PAGE_SIZE = 24;

export default function StellarMap({ game, onBack, onOpenLocation }: StellarMapProps) {
  const [locations, setLocations] = useState<CatalogEntry[]>([]);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSelected(null);
    getCatalog("", 1, game, "places", controller.signal)
      .then(async (firstPage: CatalogPage) => {
        const pageCount = Math.ceil(firstPage.total / PAGE_SIZE);
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            getCatalog("", index + 2, game, "places", controller.signal),
          ),
        );
        if (controller.signal.aborted) return;
        setLocations([firstPage, ...remainingPages].flatMap((page) => page.items));
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
        <p>Selecciona una señal para consultar su imagen y abrir la ficha del lugar. La disposición es esquemática, no representa distancias orbitales.</p>
      </header>

      {error && <div className="state-panel error-panel" role="alert"><strong>No se pudo cargar el mapa</strong><p>{error}</p></div>}
      {loading ? (
        <div className="stellar-loading" role="status">SINCRONIZANDO COORDENADAS…</div>
      ) : !error && locations.length === 0 ? (
        <div className="state-panel"><strong>No hay destinos en este catálogo</strong><p>Sincroniza los lugares del manifiesto de este juego para poblar el mapa.</p></div>
      ) : (
        <>
          <div className="stellar-map-layout">
            <div className="stellar-canvas" aria-label="Mapa esquemático de destinos">
              <div className="stellar-orbit stellar-orbit-one" aria-hidden="true" />
              <div className="stellar-orbit stellar-orbit-two" aria-hidden="true" />
              <div className="stellar-sun" aria-hidden="true">VIAJERO</div>
              {locations.map((location, index) => {
                const angle = (index / Math.max(locations.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const radius = 31 + (index % 3) * 7;
                const left = 50 + Math.cos(angle) * radius;
                const top = 50 + Math.sin(angle) * radius;
                return (
                  <button
                    aria-pressed={selected?.id === location.id}
                    className={`stellar-node${selected?.id === location.id ? " stellar-node-active" : ""}`}
                    key={location.id}
                    onClick={() => setSelected(location)}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={location.title}
                    type="button"
                  >
                    <span aria-hidden="true">✦</span>
                    <span className="visually-hidden">{location.title}</span>
                  </button>
                );
              })}
            </div>
            <aside className="stellar-location-panel" aria-live="polite">
              {selected ? (
                <>
                  {selected.imageKind === "artwork" && isBungieAsset(selected.imageUrl) && (
                    <img
                      alt=""
                      className="stellar-location-artwork"
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }}
                      src={selected.imageUrl}
                    />
                  )}
                  {selected.imageKind === "icon" && isBungieAsset(selected.imageUrl) && (
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
                  <p>{decodeHtmlEntities(selected.descriptionEs ?? selected.descriptionEn ?? selected.summaryEs)}</p>
                  <button className="hero-cta" onClick={() => onOpenLocation(selected)} type="button">ABRIR FICHA <span aria-hidden="true">↗</span></button>
                  {selected.imageKind === "artwork" && <small className="stellar-image-credit">ARTE DEL MANIFIESTO · BUNGIE</small>}
                </>
              ) : (
                <>
                  <span className="eyebrow">SEÑAL DETECTADA</span>
                  <h3>Elige una localización</h3>
                  <p>El mapa reúne los destinos presentes en el manifiesto de Bungie para este juego.</p>
                </>
              )}
              <small>{locations.length} LOCALIZACIONES EN EL MAPA</small>
            </aside>
          </div>
          <div className="stellar-location-grid">
            {locations.map((location) => (
              <button
                aria-pressed={selected?.id === location.id}
                className="stellar-location-card"
                key={location.id}
                onClick={() => setSelected(location)}
                type="button"
              >
                {location.imageKind === "artwork" && isBungieAsset(location.imageUrl) ? (
                  <img
                    alt=""
                    className="stellar-location-card-artwork"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                    src={location.imageUrl}
                  />
                ) : location.imageKind === "icon" && isBungieAsset(location.imageUrl) ? (
                  <img
                    alt=""
                    className="stellar-location-card-icon"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                    src={location.imageUrl}
                  />
                ) : null}
                <span>
                  <strong>{decodeHtmlEntities(location.title)}</strong>
                  <small>{location.sourceGame === "destiny1" ? "DESTINY" : "DESTINY 2"}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
