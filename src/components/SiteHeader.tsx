import { useState } from "react";
import { followInternalLink } from "../lib/navigation";

interface SiteHeaderProps {
  onHome: () => void;
  onCatalog: () => void;
  onChronicles: () => void;
}

export default function SiteHeader({ onHome, onCatalog, onChronicles }: SiteHeaderProps) {
  const [musicEnabled, setMusicEnabled] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="/" onClick={(event) => followInternalLink(event, onHome)} aria-label="Archivo del Viajero, inicio">
        <img className="brand-mark" src="/media/archivo.png" alt="" />
        <span className="brand-copy">
          <strong>ARCHIVO DEL VIAJERO</strong>
          <span>UN ATLAS DEL UNIVERSO DE DESTINY</span>
        </span>
      </a>
      <nav className="top-nav" aria-label="Navegación principal">
        <a href="/" onClick={(event) => followInternalLink(event, onHome)}>Inicio</a>
        <a href="/universo/all/all" onClick={(event) => followInternalLink(event, onCatalog)}>El universo</a>
        <a href="/cronicas/lanzamientos" onClick={(event) => followInternalLink(event, onChronicles)}>Crónicas</a>
      </nav>
      <div className="header-orbit-audio">
        <button
          aria-controls="destiny-orbit-player"
          aria-expanded={musicEnabled}
          aria-label={musicEnabled ? "Desactivar música de la órbita de Destiny" : "Activar música de la órbita de Destiny"}
          className={`orbit-audio-toggle${musicEnabled ? " orbit-audio-toggle-active" : ""}`}
          onClick={() => setMusicEnabled((enabled) => !enabled)}
          title={musicEnabled ? "Desactivar música de la órbita" : "Activar música de la órbita"}
          type="button"
        >
          <svg aria-hidden="true" className="orbit-audio-icon" viewBox="0 0 56 44">
            <circle cx="25" cy="24" r="13" />
            <path d="M13 24a12 12 0 0 1 24 0M14 24v7a4 4 0 0 0 4 4h2v-9h-6Zm22 0v7a4 4 0 0 1-4 4h-2v-9h6ZM39 12l5-5 2 2-5 5m-2 2 4-1 3 3-6 2-3-3 2-1Z" />
          </svg>
          <i aria-hidden="true" className={`music-dot${musicEnabled ? " music-dot-on" : ""}`} />
        </button>
        {musicEnabled && (
          <audio autoPlay hidden id="destiny-orbit-player" loop onPlay={(event) => { event.currentTarget.volume = 0.5; }} src="/media/audio/audio_d1-obita.mp3" />
        )}
      </div>
    </header>
  );
}
