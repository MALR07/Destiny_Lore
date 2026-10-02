import type { RaidDefinition } from "../data/raids";

interface RaidDetailProps {
  raid: RaidDefinition;
  onBack: () => void;
}

export default function RaidDetail({ raid, onBack }: RaidDetailProps) {
  const imagePath = `/media/site-art/raids/${raid.game}/${raid.id}.webp`;

  return (
    <section className="raid-detail-page" id="archivo">
      <button className="archive-route-back" onClick={onBack} type="button">
        ← VOLVER A RAIDS
      </button>
      <header className="raid-detail-hero">
        <div className="raid-detail-image">
          <div className="raid-detail-image-placeholder" aria-hidden="true">✦</div>
          <img alt="" onError={(event) => { event.currentTarget.hidden = true; }} src={imagePath} />
          <small>ARTE DE LA INCURSIÓN · AÑADIR EN README</small>
        </div>
        <div className="raid-detail-hero-copy">
          <span className="eyebrow">{raid.label} · {raid.game === "destiny1" ? "DESTINY" : "DESTINY 2"}</span>
          <h2>{raid.title}</h2>
          <p className="raid-detail-original">{raid.titleEn}</p>
          <p>{raid.summary}</p>
          <a href={`#raid-rewards-${raid.id}`} className="raid-detail-jump">BOTÍN DE LA INCURSIÓN ↓</a>
        </div>
      </header>

      <section className="raid-detail-section" id={`raid-rewards-${raid.id}`}>
        <div className="raid-section-heading">
          <span className="eyebrow">RECOMPENSAS</span>
          <h3>Botín destacado</h3>
          <p>Armas exóticas, piezas de raid y recompensas características de esta actividad.</p>
        </div>
        {raid.rewards.length > 0 ? (
          <ul className="raid-reward-list">
            {raid.rewards.map((reward) => <li key={reward}>{reward}</li>)}
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
    </section>
  );
}
