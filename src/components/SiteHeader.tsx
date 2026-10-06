interface SiteHeaderProps {
  onHome: () => void;
  onCatalog: () => void;
  onChronicles: () => void;
}

export default function SiteHeader({ onHome, onCatalog, onChronicles }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="Archivo del Viajero, inicio" type="button">
        <img className="brand-mark" src="/media/archivo.png" alt="" />
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
