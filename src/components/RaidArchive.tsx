import { raids } from "../data/raids";
interface RaidArchiveProps {
  game: "destiny1" | "destiny2";
  search: string;
  onOpenRaid: (raidId: string) => void;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
}

export default function RaidArchive({ game, search, onOpenRaid }: RaidArchiveProps) {
  const query = normalize(search);
  const matchingRaids = raids.filter((raid) =>
    raid.game === game
    && (!query || normalize(`${raid.title} ${raid.titleEn} ${raid.label}`).includes(query)),
  );

  if (matchingRaids.length === 0) {
    return (
      <div className="state-panel">
        <span className="state-symbol">⌕</span>
        <div>
          <strong>No se encontraron incursiones</strong>
          <p>Prueba con otro nombre o borra la búsqueda para volver a mostrar las incursiones de este juego.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="raid-grid">
      {matchingRaids.map((raid) => {
        return (
          <article className="raid-card" key={raid.id}>
            <div className="raid-card-art" aria-hidden="true"><span>✦</span></div>
            <div className="raid-card-copy">
              <span className="eyebrow">{raid.label}</span>
              <h3>{raid.title}</h3>
              <p>{raid.titleEn}</p>
              <button onClick={() => onOpenRaid(raid.id)} type="button">
                VER BOTÍN Y GUÍA COMPLETA <span aria-hidden="true">↗</span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
