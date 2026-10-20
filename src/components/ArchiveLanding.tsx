import GuardianClassSelector from "./GuardianClassSelector";
import { followInternalLink } from "../lib/navigation";
import { pathForGame } from "../lib/routes";

interface ArchiveLandingProps {
  onOpenGame: (game: "destiny1" | "destiny2") => void;
  onOpenChronicles: (section: "books" | "releases" | "timeline") => void;
  onOpenGrimoire: () => void;
  onOpenUniverse: () => void;
}

const GAMES = [
  {
    id: "destiny1" as const,
    title: "Destiny",
    subtitle: "EL COMIENZO DEL VIAJE",
    detail: "Explora el Grimorio, los lugares y las expansiones que iniciaron la leyenda.",
    art: "d1",
    image: "/media/destiny%201.jpg",
  },
  {
    id: "destiny2" as const,
    title: "Destiny 2",
    subtitle: "LA LUCHA POR LA LUZ",
    detail: "Recorre sus relatos, destinos y campañas a través de las eras.",
    art: "d2",
    image: "/media/desty%202.jpg",
  },
];

export default function ArchiveLanding({
  onOpenGame,
  onOpenChronicles,
  onOpenGrimoire,
  onOpenUniverse,
}: ArchiveLandingProps) {
  return (
    <section className="landing-hub" aria-label="Entradas al archivo">
      <div className="landing-heading">
        <span className="eyebrow">ARCHIVO DEL VIAJERO</span>
        <h2>Elige tu <em>ruta.</em></h2>
        <p>Entra por juego, sigue las crónicas o busca cualquier elemento del universo.</p>
      </div>

      <div className="game-portal-grid">
        {GAMES.map((entry) => (
          <a
            className={`game-portal-card game-portal-${entry.art}`}
            href={pathForGame(entry.id)}
            key={entry.id}
            onClick={(event) => followInternalLink(event, () => onOpenGame(entry.id))}
          >
            <img className="game-portal-art" src={entry.image} alt="" aria-hidden="true" />
            <span className="game-portal-orbit" aria-hidden="true" />
            <span className="eyebrow">{entry.subtitle}</span>
            <strong>{entry.title}</strong>
            <span className="game-portal-description">{entry.detail}</span>
            <span className="game-portal-link">ENTRAR AL ARCHIVO <i aria-hidden="true">↗</i></span>
          </a>
        ))}
      </div>

      <div className="landing-destinations">
        <article className="landing-destination">
          <span className="landing-symbol" aria-hidden="true">✦</span>
          <div>
            <span className="eyebrow">GRIMORIO · LIBROS · LANZAMIENTOS · CRONOLOGÍA</span>
            <h3>Crónicas</h3>
            <p>Lee el Grimorio de Destiny, explora los libros y lanzamientos y sigue el recorrido del Guardián.</p>
          </div>
          <div className="landing-actions">
            <a href="/destiny/grimorio" onClick={(event) => followInternalLink(event, onOpenGrimoire)}>GRIMORIO</a>
            <a href="/cronicas/libros" onClick={(event) => followInternalLink(event, () => onOpenChronicles("books"))}>LIBROS</a>
            <a href="/cronicas/lanzamientos" onClick={(event) => followInternalLink(event, () => onOpenChronicles("releases"))}>LANZAMIENTOS</a>
            <a href="/cronicas/recorrido" onClick={(event) => followInternalLink(event, () => onOpenChronicles("timeline"))}>RECORRIDO</a>
          </div>
        </article>
        <a className="landing-universe" href="/universo/all/all" onClick={(event) => followInternalLink(event, onOpenUniverse)}>
          <span className="landing-symbol" aria-hidden="true">⌕</span>
          <span>
            <span className="eyebrow">BÚSQUEDA TRANSVERSAL</span>
            <strong>Archivo del universo</strong>
            <span>Armas, armaduras, personajes, lugares, pueblos y clases.</span>
          </span>
          <i aria-hidden="true">↗</i>
        </a>
      </div>

      <GuardianClassSelector />
    </section>
  );
}
