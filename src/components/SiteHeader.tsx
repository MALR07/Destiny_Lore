interface SiteHeaderProps {
  onHome: () => void;
  onCatalog: () => void;
  onChronicles: () => void;
}

export default function SiteHeader({ onHome, onCatalog, onChronicles }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="Archivo del Viajero, inicio" type="button">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M20 3 35 12v16L20 37 5 28V12L20 3Z" />
            <path d="m20 10 8 5v10l-8 5-8-5V15l8-5Z" />
            <circle cx="20" cy="20" r="3" />
          </svg>
        </span>
        <span className="brand-copy">
          <strong>ARCHIVO DEL VIAJERO</strong>
          <span>UN ATLAS DEL UNIVERSO DE DESTINY</span>
        </span>
      </button>
      <nav className="top-nav" aria-label="Navegación principal">
        <button onClick={onHome} type="button">Inicio</button>
        <button onClick={onCatalog} type="button">El universo</button>
        <button onClick={onChronicles} type="button">Crónicas</button>
      </nav>
      <span className="edition-tag">EDICIÓN GUARDIÁN <i /></span>
    </header>
  );
}
