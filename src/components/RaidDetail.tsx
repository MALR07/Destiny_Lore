import { useEffect, useState } from "react";
import { getCatalogEntryByTitle } from "../lib/api";
import type { CatalogEntry } from "../types/lore";
import type { RaidDefinition } from "../data/raids";
import { getRaidArtwork } from "../data/raid-artwork";
import CatalogReader from "./CatalogReader";
import ApiLoading from "./ApiLoading";

interface RaidDetailProps {
  raid: RaidDefinition;
  onBack: () => void;
}

export default function RaidDetail({ raid, onBack }: RaidDetailProps) {
  const [rewardItems, setRewardItems] = useState<Record<string, CatalogEntry>>({});
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [unmatchedRewardCount, setUnmatchedRewardCount] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<CatalogEntry | null>(null);
  const artwork = getRaidArtwork(raid.id);
  const imagePath = artwork?.src ?? `/media/site-art/raids/${raid.game}/${raid.id}.webp`;

  useEffect(() => {
    const controller = new AbortController();
    const searchableRewards = raid.rewards.filter((reward) => !/^armaduras?\b/i.test(reward));
    setRewardItems({});
    setRewardError(null);
    setUnmatchedRewardCount(0);
    setRewardLoading(true);
    setSelectedReward(null);

    Promise.allSettled(searchableRewards.map(async (reward) => {
      const title = reward.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const entry = await getCatalogEntryByTitle(title, raid.game, raid.releaseSlug, controller.signal);
      return [reward, entry] as const;
    })).then((results) => {
      if (controller.signal.aborted) return;
      const matchedItems: Record<string, CatalogEntry> = {};
      const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
      const unmatchedCount = results.filter((result) =>
        result.status === "fulfilled" && result.value[1] === null,
      ).length;
      for (const result of results) {
        if (result.status === "fulfilled" && result.value[1]) {
          matchedItems[result.value[0]] = result.value[1];
        }
      }
      setRewardItems(matchedItems);
      setUnmatchedRewardCount(unmatchedCount);
      setRewardLoading(false);
      if (failures.length > 0) {
        const firstReason = failures[0].reason;
        const message = firstReason instanceof Error ? firstReason.message : "Error de conexión con el catálogo.";
        setRewardError(`${failures.length} recompensas no se pudieron consultar: ${message}`);
      }
    });

    return () => controller.abort();
  }, [raid]);

  return (
    <section className="raid-detail-page" id="archivo">
      <button className="archive-route-back" onClick={onBack} type="button">
        ← VOLVER A RAIDS
      </button>
      <header className="raid-detail-hero">
        <div className="raid-detail-image">
          <div className="raid-detail-image-placeholder" aria-hidden="true">✦</div>
          <img alt="" onError={(event) => { event.currentTarget.hidden = true; }} src={imagePath} />
          {artwork ? (
            <a className="raid-detail-image-credit" href={artwork.sourceUrl} rel="noreferrer" target="_blank">
              {artwork.credit} · VER FUENTE ↗
            </a>
          ) : (
            <small>ARTE DE LA INCURSIÓN · BUNGIE</small>
          )}
        </div>
        <div className="raid-detail-hero-copy">
          <span className="eyebrow">{raid.label} · {raid.game === "destiny1" ? "DESTINY" : "DESTINY 2"}</span>
          <h2>{raid.title}</h2>
          <p className="raid-detail-original">{raid.titleEn}</p>
          <p>{raid.summary}</p>
          <a href={`#raid-rewards-${raid.id}`} className="raid-detail-jump">BOTÍN DE LA INCURSIÓN ↓</a>
        </div>
      </header>

      <section className="raid-detail-section raid-video-section" aria-labelledby="raid-video-title">
        <div className="raid-section-heading">
          <span className="eyebrow">RECORRIDO COMPLETO · {raid.game === "destiny1" ? "DESTINY ORIGINAL" : "DESTINY 2"}</span>
          <h3 id="raid-video-title">{raid.title}: incursión completa</h3>
          <p>
            {raid.completeRun
              ? `${raid.completeRun.title} · ${raid.completeRun.creator}`
              : "Todavía no hay un recorrido completo verificado para esta incursión."}
          </p>
        </div>
        {raid.completeRun ? (
          <div className="raid-detail-video">
            <iframe
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={`https://www.youtube-nocookie.com/embed/${raid.completeRun.youtubeId}?rel=0`}
              title={raid.completeRun.title}
            />
          </div>
        ) : (
          <div className="raid-guide-note" role="status">
            Se añadirá cuando encontremos una grabación fiable de una raid completa, no solo una guía o un tráiler.
          </div>
        )}
      </section>

      <section aria-busy={rewardLoading} className="raid-detail-section" id={`raid-rewards-${raid.id}`}>
        <div className="raid-section-heading">
          <span className="eyebrow">RECOMPENSAS</span>
          <h3>Botín destacado</h3>
          <p>Equipo del catálogo oficial, con nombres localizados al español e imágenes ampliables cuando están disponibles.</p>
        </div>
        {rewardLoading && <ApiLoading compact message="Consultando el catálogo oficial del equipo…" />}
        {rewardError && <p className="raid-reward-error" role="alert">{rewardError}</p>}
        {!rewardLoading && unmatchedRewardCount > 0 && (
          <p className="raid-reward-loading" role="status">
            {unmatchedRewardCount} nombres no aparecen en el catálogo de esta incursión; se muestran como están registrados.
          </p>
        )}
        {raid.rewards.length > 0 ? (
          <ul className="raid-reward-list">
            {raid.rewards.map((reward) => {
              const item = rewardItems[reward];
              const imageUrl = item?.imageUrl ?? item?.iconUrl;
              return (
                <li className={item ? "raid-reward-card" : ""} key={reward}>
                  {item ? (
                    <button
                      aria-label={`Ver ficha de ${item.title}`}
                      className="raid-reward-item"
                      onClick={() => setSelectedReward(item)}
                      type="button"
                    >
                      {imageUrl && (
                        <img
                          alt=""
                          loading="lazy"
                          onError={(event) => { event.currentTarget.hidden = true; }}
                          src={imageUrl}
                        />
                      )}
                      <span>{item.title}</span>
                      <small>{item.rarity ?? item.itemType ?? "EQUIPO"}</small>
                    </button>
                  ) : (
                    reward
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="raid-guide-note" role="status">
            El botín de esta raid está pendiente de cotejo con su tabla oficial antes de publicarlo.
          </div>
        )}
      </section>

      <section className="raid-detail-section">
        <div className="raid-section-heading">
          <span className="eyebrow">RECORRIDO ENCUENTRO POR ENCUENTRO</span>
          <h3>Guía completa</h3>
          <p>Pasos de mecánica y coordinación para completar la incursión en orden.</p>
        </div>
        {raid.encounters.length > 0 ? (
          <ol className="raid-encounter-list">
            {raid.encounters.map((encounter, index) => (
              <li key={encounter.name}>
                <span className="raid-encounter-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{encounter.name}</h4>
                  <p>{encounter.guide}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="raid-guide-note">
            La guía encuentro por encuentro se publicará cuando sus mecánicas y botín estén verificados.
          </div>
        )}
      </section>
      <button className="archive-route-back raid-detail-back-bottom" onClick={onBack} type="button">
        ← VOLVER AL ÍNDICE DE RAIDS
      </button>
      {selectedReward && <CatalogReader entry={selectedReward} largeArtwork onClose={() => setSelectedReward(null)} />}
    </section>
  );
}
