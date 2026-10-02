interface ArchiveLandingProps {
  onOpenGame: (game: "destiny1" | "destiny2") => void;
  onOpenChronicles: (section: "books" | "releases" | "timeline") => void;
  onOpenUniverse: () => void;
}

const GAMES = [
  {
    id: "destiny1" as const,
    title: "Destiny",
    subtitle: "EL COMIENZO DEL VIAJE",
    detail: "Explora el Grimorio, los lugares y las expansiones que iniciaron la leyenda.",
    art: "d1",
  },
  {
    id: "destiny2" as const,
    title: "Destiny 2",
    subtitle: "LA LUCHA POR LA LUZ",
    detail: "Recorre sus relatos, destinos y campañas a través de las eras.",
    art: "d2",
  },
];

export default function ArchiveLanding({
  onOpenGame,
  onOpenChronicles,
  onOpenUniverse,
}: ArchiveLandingProps) {
  return (
    <section className="landing-hub" aria-label="Entradas al archivo">
      <div className="landing-heading">
        <span className="eyebrow">ELIGE TU RUTA · ARCHIVO DEL VIAJERO</span>
        <h2>Dos eras. <em>Una misma Luz.</em></h2>
        <p>Entra por juego, sigue las crónicas o busca cualquier elemento del universo.</p>
      </div>

      <div className="game-portal-grid">
        {GAMES.map((entry) => (
          <button
            className={`game-portal-card game-portal-${entry.art}`}
            key={entry.id}
            onClick={() => onOpenGame(entry.id)}
            type="button"
          >
            <span className="game-portal-orbit" aria-hidden="true" />
            <span className="eyebrow">{entry.subtitle}</span>
            <strong>{entry.title}</strong>
            <span className="game-portal-description">{entry.detail}</span>
            <span className="game-portal-link">ENTRAR AL ARCHIVO <i aria-hidden="true">↗</i></span>
          </button>
        ))}
      </div>

      <div className="landing-destinations">
        <article className="landing-destination">
          <span className="landing-symbol" aria-hidden="true">✦</span>
          <div>
            <span className="eyebrow">LIBROS · LANZAMIENTOS · CRONOLOGÍA</span>
            <h3>Crónicas</h3>
            <p>Lee las colecciones y sigue el recorrido del Guardián.</p>
          </div>
          <div className="landing-actions">
            <button onClick={() => onOpenChronicles("books")} type="button">LIBROS</button>
            <button onClick={() => onOpenChronicles("releases")} type="button">LANZAMIENTOS</button>
            <button onClick={() => onOpenChronicles("timeline")} type="button">RECORRIDO</button>
          </div>
        </article>
        <button className="landing-universe" onClick={onOpenUniverse} type="button">
          <span className="landing-symbol" aria-hidden="true">⌕</span>
          <span>
            <span className="eyebrow">BÚSQUEDA TRANSVERSAL</span>
            <strong>Archivo del universo</strong>
            <span>Armas, armaduras, personajes, lugares, pueblos y clases.</span>
          </span>
          <i aria-hidden="true">↗</i>
        </button>
      </div>
    </section>
  );
}
