import { useEffect, useRef, useState } from "react";

const SUBCLASSES = [
  { id: "solar", name: "Solar", element: "LUZ", artwork: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2a1773e10968f2d088b97c22b22bba9e.png", description: "Canaliza el poder del Sol para abrasar a tus enemigos y sostener a tu escuadra." },
  { id: "arc", name: "Arco", element: "LUZ", artwork: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_092d066688b879c807c3b460afdd61e6.png", description: "Desata energía eléctrica para moverte con rapidez y encadenar ataques." },
  { id: "void", name: "Vacío", element: "LUZ", artwork: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_ceb2f6197dccf3958bb31cc783eb97a0.png", description: "Domina la energía del Vacío para debilitar, protegerte y controlar el campo de batalla." },
  { id: "stasis", name: "Estasis", element: "OSCURIDAD", artwork: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_530c4c3e7981dc2aefd24fd3293482bf.png", description: "Invoca el frío de la Oscuridad para ralentizar y congelar a tus adversarios." },
  { id: "strand", name: "Filamento", element: "OSCURIDAD", artwork: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_b2fe51a94f3533f97079dfa0d27a4096.png", description: "Manipula los hilos que conectan toda vida para suspender enemigos y desplazarte." },
  { id: "prismatic", name: "Prismática", element: "LUZ + OSCURIDAD", description: "Combina poderes de la Luz y la Oscuridad y desata la Trascendencia." },
] as const;

const GUARDIAN_CLASSES = [
  {
    id: "titan",
    name: "Titán",
    lineage: "VANGUARDIA · DEFENSA",
  },
  {
    id: "warlock",
    name: "Hechicero",
    lineage: "SABIDURÍA · PODER",
  },
  {
    id: "hunter",
    name: "Cazador",
    lineage: "RASTREO · PRECISIÓN",
  },
] as const;

type GuardianClassId = (typeof GUARDIAN_CLASSES)[number]["id"];
type SubclassId = (typeof SUBCLASSES)[number]["id"];

const CLASS_ICONS: Record<GuardianClassId, string> = {
  titan: "/media/site-art/titan2.jpg",
  warlock: "/media/site-art/hecicero.jpg",
  hunter: "/media/site-art/cazador.jpg",
};

const PRISMATIC_ARTWORK: Record<GuardianClassId, string> = {
  titan: "https://www.bungie.net/common/destiny2_content/icons/c1740d829e62afc40a9e57af4e3cad4c.png",
  warlock: "https://www.bungie.net/common/destiny2_content/icons/652406349e99e3db0c3198f78af4eeae.png",
  hunter: "https://www.bungie.net/common/destiny2_content/icons/fab506e62fa4f188bfe2fb6d56b39614.png",
};

const CLASS_PREVIEW_VIDEOS: Record<GuardianClassId, string> = {
  titan: "/media/videos/titan.mp4",
  warlock: "/media/videos/hechicero.mp4",
  hunter: "/media/videos/cazador.mp4",
};

const SUPER_DETAILS = {
  "ward-of-dawn": { name: "Burbuja", description: "Levanta una cúpula protectora que resguarda al equipo y potencia a quienes combaten desde dentro.", icon: "/common/destiny2_content/icons/1caf1eccf1072969ab93bd35fde62599.png", start: 0 },
  "sentinel-shield": { name: "Escudo centinela", description: "Invoca un escudo de Vacío para atacar cuerpo a cuerpo y proteger a los aliados que se cubren tras él.", icon: "/common/destiny2_content/icons/a929ea604d638e5e99125e48f76989e2.png", start: 31 },
  "twilight-arsenal": { name: "Arsenal crepuscular", description: "Lanza hachas de Vacío que atraen y detonan enemigos; después puedes recogerlas y luchar con ellas.", icon: "/common/destiny2_content/icons/ad8fd9cd668f4d980b29e26ade9e4369.png", start: 76 },
  "fists-of-havoc": { name: "Puño del caos", description: "Carga los puños de energía de Arco para golpear el suelo y arrasar a los enemigos cercanos.", icon: "/common/destiny2_content/icons/5bc4f4029b38fd41d0232460b4295600.png", start: 126 },
  thundercrash: { name: "Golpe de trueno", description: "Surca el aire envuelto en Arco y estampa tu cuerpo contra el objetivo con una explosión devastadora.", icon: "/common/destiny2_content/icons/adb140aba83a6c14345852531d4ee2e0.png", start: 169 },
  "hammer-of-sol": { name: "Martillo de Sol", description: "Forja un martillo solar y lánzalo contra los enemigos para provocar explosiones de fuego.", icon: "/common/destiny2_content/icons/9d1fd669f61cce4abd35dbefd22ba90c.png", start: 203 },
  "burning-maul": { name: "Mazo ardiente", description: "Empuña un enorme mazo solar para girar entre los enemigos y abrir grietas de llamas en el suelo.", icon: "/common/destiny2_content/icons/a0391bd2a8cf73c58cec261961db0136.png", start: 240 },
  "glacial-quake": { name: "Terremoto glacial", description: "Crea guanteletes de Estasis y golpea el suelo para levantar cristales y congelar a quienes te rodean.", icon: "/common/destiny2_content/icons/3c522f849a7d4d86d5224d7d5d5671a4.png", start: 285 },
  bladefury: { name: "Furia de cuchillas", description: "Teje cuchillas de Filamento y encadena tajos rápidos con proyectiles que persiguen a tus presas.", icon: "/common/destiny2_content/icons/228496331415f6854ef589f33c2a2622.png", start: 339 },
  daybreak: { name: "Espada del alba", description: "Despliega alas solares y una espada de fuego para surcar el campo y lanzar proyectiles abrasadores.", icon: "/common/destiny2_content/icons/f35f3a248700afeeac260bd5340abbd8.jpg", start: 422 },
  "well-of-radiance": { name: "Pozo de resplandor", description: "Clava tu espada en el suelo y crea un pozo que cura y potencia a los aliados cercanos.", icon: "/common/destiny2_content/icons/2f3615ddcd86ab7c50653d2d1847c3bf.png", start: 473 },
  "song-of-flame": { name: "Canción de llamas", description: "Te vuelves radiante, fortaleces a tu escuadra y desatas una ráfaga de ataques solares.", icon: "/common/destiny2_content/icons/ed2e5deb9b67c0120468ee136f98f2b2.png", start: 497 },
  "nova-vortex": { name: "Bomba nova: Vórtice", description: "Lanza una bomba de Vacío que detona y crea un vórtice que succiona y daña a los enemigos.", icon: "/common/destiny2_content/icons/e9dc1cc0179cda4d2445845cf8992a7e.png", start: 552 },
  "nova-cataclysm": { name: "Bomba nova: Cataclismo", description: "Dispara una bomba de Vacío que persigue objetivos y se fragmenta en proyectiles explosivos.", icon: "/common/destiny2_content/icons/b1efa0eaa710653d85e2fcf5321047fb.png", start: 577 },
  "nova-warp": { name: "Distorsión nova", description: "Te envuelves en Vacío para teletransportarte y liberar explosiones a corta distancia.", icon: "/common/destiny2_content/icons/feb001db8e9776bc822007c74564c1b6.png", start: 600 },
  stormtrance: { name: "Trance tormentoso", description: "Canaliza un rayo de Arco continuo mientras avanzas y encadenas descargas entre enemigos.", icon: "/common/destiny2_content/icons/31a0445d352fd44b62c9a8dd2752ccdf.png", start: 663 },
  "chaos-reach": { name: "Alcance del caos", description: "Proyecta un potente haz de Arco que atraviesa y desintegra todo lo que encuentra.", icon: "/common/destiny2_content/icons/b54195b2d82a31ae970ca85fb7fb0be7.png", start: 717 },
  "winters-wrath": { name: "Ira invernal", description: "Invoca un báculo de Estasis: congela grupos de enemigos y hazlos añicos con una onda de choque.", icon: "/common/destiny2_content/icons/c9f25c8f6d5e647366ffc4f71a825961.png", start: 745 },
  needlestorm: { name: "Tormenta de agujas", description: "Lanza una descarga de proyectiles de Filamento que persiguen a los enemigos y se convierten en madejas.", icon: "/common/destiny2_content/icons/2e486aef07bd3551c35807f416ba0b6c.png", start: 797 },
  "arc-staff": { name: "Bastón del arco", description: "Empuña un bastón de Arco para encadenar golpes veloces y desviar proyectiles.", icon: "/common/destiny2_content/icons/435489f514e2bf88d25c452a96f2dff9.png", start: 863 },
  "gathering-storm": { name: "Tormenta creciente", description: "Lanza un bastón de Arco que impacta y descarga rayos sobre la zona durante unos instantes.", icon: "/common/destiny2_content/icons/edf23f2e6951efcab4c4b10630b6f7c4.png", start: 911 },
  "storms-edge": { name: "Filo de la tormenta", description: "Lanza una daga de Arco, teletranspórtate hasta ella y ejecuta un giro devastador; puedes repetirlo.", icon: "/common/destiny2_content/icons/515dafc7f95e310e26bf3189f640231c.png", start: 937 },
  "golden-gun-marksman": { name: "Pistola dorada: Tirador", description: "Invoca una pistola solar de precisión: cada disparo certero inflige un daño enorme.", icon: "/common/destiny2_content/icons/52f2eb1fefa20e9c7b064c190855d588.png", start: 971 },
  "golden-gun-deadshot": { name: "Pistola dorada: Acribillador", description: "Saca una pistola solar de disparo rápido que destaca al abatir grupos de enemigos.", icon: "/common/destiny2_content/icons/e19ebe4d56d6f95d582703f6b481813f.png", start: 999 },
  "blade-barrage": { name: "Lluvia de cuchillas", description: "Salta y arroja una lluvia de cuchillos explosivos que cubre una amplia zona.", icon: "/common/destiny2_content/icons/0b01a6ddceb7b0e2e86ebcb7a6a83eaa.png", start: 1020 },
  "shadowshot-deadfall": { name: "Tiro en las sombras: Trampa mortal", description: "Dispara una flecha de Vacío que crea una trampa: ata, debilita y comparte el daño entre enemigos.", icon: "/common/destiny2_content/icons/61feac4f1271ba6cecc29cc50e20ab5a.png", start: 1045 },
  "shadowshot-mobius": { name: "Tiro en las sombras: Aljaba de Möbius", description: "Dispara varias andanadas de flechas de Vacío que atan y debilitan a los objetivos.", icon: "/common/destiny2_content/icons/986e8f2dd0699371d605a331bb63742a.png", start: 1064 },
  "spectral-blades": { name: "Hojas espectrales", description: "Entra en las sombras y caza a tus adversarios con dos hojas de Vacío.", icon: "/common/destiny2_content/icons/1fbfacd5dfe847c5cd0262c5616653ff.png", start: 1095 },
  "silence-and-squall": { name: "Silencio y calma", description: "Lanza dos kamas de Estasis: una congela y la otra genera una tormenta que persigue enemigos.", icon: "/common/destiny2_content/icons/a8bbee32ce8f259e7b9e112c0c8a401a.png", start: 1138 },
  silkstrike: { name: "Sedal de seda", description: "Forma un dardo de Filamento y balancea su punta para azotar a los enemigos a distintas distancias.", icon: "/common/destiny2_content/icons/3da7e8684b09600e90ea5c16f1edebe0.png", start: 1167 },
} as const;

type SuperId = keyof typeof SUPER_DETAILS;

const SUPER_SELECTIONS: Record<GuardianClassId, Record<SubclassId, readonly SuperId[]>> = {
  titan: {
    solar: ["hammer-of-sol", "burning-maul"],
    arc: ["fists-of-havoc", "thundercrash"],
    void: ["ward-of-dawn", "sentinel-shield", "twilight-arsenal"],
    stasis: ["glacial-quake"],
    strand: ["bladefury"],
    prismatic: ["hammer-of-sol", "thundercrash", "twilight-arsenal"],
  },
  warlock: {
    solar: ["daybreak", "well-of-radiance", "song-of-flame"],
    arc: ["stormtrance", "chaos-reach"],
    void: ["nova-vortex", "nova-cataclysm", "nova-warp"],
    stasis: ["winters-wrath"],
    strand: ["needlestorm"],
    prismatic: ["song-of-flame", "nova-cataclysm", "needlestorm"],
  },
  hunter: {
    solar: ["golden-gun-marksman", "golden-gun-deadshot", "blade-barrage"],
    arc: ["arc-staff", "gathering-storm", "storms-edge"],
    void: ["shadowshot-deadfall", "shadowshot-mobius", "spectral-blades"],
    stasis: ["silence-and-squall"],
    strand: ["silkstrike"],
    prismatic: ["golden-gun-deadshot", "silence-and-squall", "silkstrike"],
  },
};

const SUPER_SHOWCASE_VIDEO = "O0uvtZMID9E";
const BUNGIE_ICON_ORIGIN = "https://www.bungie.net";
const SUBCLASS_OPTIONS_ID = "guardian-subclass-options";

export default function GuardianClassSelector() {
  const [selectedClass, setSelectedClass] = useState<GuardianClassId | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassId | null>(null);
  const [selectedSuper, setSelectedSuper] = useState<SuperId | null>(null);
  const [isSubclassPickerOpen, setIsSubclassPickerOpen] = useState(false);
  const showcaseVideo = useRef<HTMLVideoElement>(null);
  const previewClass = selectedClass ?? "titan";
  const guardianClass = GUARDIAN_CLASSES.find((entry) => entry.id === previewClass) ?? GUARDIAN_CLASSES[0];
  const subclass = selectedSubclass
    ? SUBCLASSES.find((entry) => entry.id === selectedSubclass) ?? null
    : null;
  const artworkUrl = subclass
    ? subclass.id === "prismatic"
      ? PRISMATIC_ARTWORK[previewClass]
      : subclass.artwork
    : null;
  const availableSupers = selectedClass && selectedSubclass
    ? SUPER_SELECTIONS[selectedClass][selectedSubclass]
    : [];
  const activeSuperId = availableSupers.find((superId) => superId === selectedSuper) ?? availableSupers[0];
  const activeSuper = activeSuperId ? SUPER_DETAILS[activeSuperId] : null;
  const superVideoUrl = activeSuper
    ? `https://www.youtube-nocookie.com/embed/${SUPER_SHOWCASE_VIDEO}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&start=${activeSuper.start}&end=${activeSuper.start + 14}`
    : "";

  useEffect(() => {
    const video = showcaseVideo.current;
    if (!video) return;

    void video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(`No se pudo reproducir el vídeo principal de ${previewClass}.`, error);
    });
  }, [previewClass]);

  return (
    <section className="class-selector" aria-labelledby="class-selector-heading">
      <div className="class-selector-heading">
        <span className="eyebrow">SELECCIÓN DE GUARDIÁN</span>
        <h3 id="class-selector-heading">Elige tu <em>leyenda.</em></h3>
        <p>Primero elige tu leyenda. Sus subclases y supers se desplegarán paso a paso.</p>
      </div>

      <div className="guardian-selection-layout">
        <div className={`guardian-showcase guardian-showcase-${previewClass}${subclass ? ` guardian-showcase-${subclass.id}` : ""}`}>
          <video
            autoPlay
            className="guardian-showcase-video"
            key={previewClass}
            loop
            muted
            playsInline
            preload={previewClass === "titan" ? "auto" : "metadata"}
            ref={showcaseVideo}
            src={CLASS_PREVIEW_VIDEOS[previewClass]}
          />
          {selectedClass && subclass && artworkUrl ? (
            <div className="guardian-showcase-content" key={`${selectedClass}-${subclass.id}`}>
              <img alt="" className="guardian-showcase-sigil" src={CLASS_ICONS[selectedClass]} />
              <img alt="" className="guardian-showcase-artwork" src={artworkUrl} />
              <span className="eyebrow">{guardianClass.name} · {subclass.element}</span>
              <strong>{subclass.name}</strong>
              <span className="guardian-subclass-description">{subclass.description}</span>
            </div>
          ) : (
            <div className="guardian-showcase-prompt">
              <span className="eyebrow">{selectedClass ? "SIGUIENTE PASO" : "VISTA PREVIA · TITÁN"}</span>
              <strong>{selectedClass ? "Elige una subclase" : "Elige tu leyenda"}</strong>
              <span>{selectedClass ? "Abre el selector para descubrir sus poderes." : "Selecciona Titán, Hechicero o Cazador para comenzar."}</span>
            </div>
          )}
          <div className="guardian-showcase-caption">
            <span>{selectedClass ? guardianClass.name.toLocaleUpperCase("es") : "ELIGE TU LEYENDA"}</span>
            <span>{subclass ? subclass.element : "PASO 01"}</span>
          </div>
        </div>

        <div className="guardian-class-panel">
          <span className="eyebrow">{selectedClass ? "PASO 01 · LEYENDA SELECCIONADA" : "PASO 01 · ELIGE TU LEYENDA"}</span>
          <div className="guardian-class-options" role="group" aria-label="Clases de Guardián">
            {GUARDIAN_CLASSES.map((entry) => (
              <button
                aria-pressed={selectedClass === entry.id}
                className={`guardian-class-option guardian-class-option-${entry.id}${selectedClass === entry.id ? " guardian-class-option-active" : ""}`}
                key={entry.id}
                onClick={() => {
                  setSelectedClass(entry.id);
                  setSelectedSubclass(null);
                  setSelectedSuper(null);
                  setIsSubclassPickerOpen(true);
                }}
                type="button"
              >
                <img alt="" className="guardian-class-option-sigil" src={CLASS_ICONS[entry.id]} />
                <span className="guardian-class-option-copy">
                  <strong>{entry.name}</strong>
                  <small>{entry.lineage}</small>
                  <small className="guardian-class-preview-status">EMBLEMA DE CLASE</small>
                </span>
                <span className="guardian-class-option-arrow" aria-hidden="true">{selectedClass === entry.id ? "◆" : "◇"}</span>
              </button>
            ))}
          </div>
          <div className="guardian-class-description" aria-live="polite">
            <span className="eyebrow">{selectedClass ? guardianClass.lineage : "TU AVENTURA EMPIEZA AQUÍ"}</span>
            <strong>{selectedClass ? guardianClass.name : "Elige tu leyenda"}</strong>
            <span>{selectedClass ? "Ahora despliega y elige una subclase para continuar." : "Al elegir una clase aparecerán sus subclases y poderes."}</span>
          </div>
        </div>
      </div>

      {selectedClass && (
        <div className={`subclass-selector${isSubclassPickerOpen ? " subclass-selector-open" : ""}`} aria-labelledby="subclass-selector-heading">
          <div className="subclass-selector-heading">
            <span className="eyebrow">PASO 02 · {guardianClass.name.toLocaleUpperCase("es")}</span>
            <h4 id="subclass-selector-heading">Elige una subclase</h4>
            <p>{subclass ? subclass.description : "Despliega las opciones para explorar los poderes de tu leyenda."}</p>
          </div>
          <button
            aria-controls={SUBCLASS_OPTIONS_ID}
            aria-expanded={isSubclassPickerOpen}
            className="subclass-picker-toggle"
            onClick={() => setIsSubclassPickerOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span className="subclass-picker-selection">
              {subclass && artworkUrl && <img alt="" src={artworkUrl} />}
              <span>
                <small>{subclass ? "SUBCLASE SELECCIONADA" : "CONTINUAR TU LEYENDA"}</small>
                <strong>{subclass?.name ?? "Desplegar subclases"}</strong>
              </span>
            </span>
            <span className="subclass-picker-arrow" aria-hidden="true">{isSubclassPickerOpen ? "−" : "+"}</span>
          </button>
          <div
            className="subclass-card-grid"
            hidden={!isSubclassPickerOpen}
            id={SUBCLASS_OPTIONS_ID}
            role="group"
            aria-label={`Subclases de ${guardianClass.name}`}
          >
            {SUBCLASSES.map((entry) => (
              <button
                aria-pressed={selectedSubclass === entry.id}
                className={`subclass-card subclass-card-${entry.id}${selectedSubclass === entry.id ? " subclass-card-active" : ""}`}
                key={entry.id}
                onClick={() => {
                  setSelectedSubclass(entry.id);
                  setSelectedSuper(null);
                  setIsSubclassPickerOpen(false);
                }}
                type="button"
              >
                <img alt="" className="subclass-card-artwork" src={entry.id === "prismatic" ? PRISMATIC_ARTWORK[selectedClass] : entry.artwork} />
                <span className="subclass-card-orbit" aria-hidden="true">{entry.id === "prismatic" ? "✧" : "◇"}</span>
                <span className="eyebrow">{entry.element}</span>
                <strong>{entry.name}</strong>
                <span className="subclass-card-link">{selectedSubclass === entry.id ? "SUBCLASE SELECCIONADA" : "VER SUBCLASE"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedClass && subclass && activeSuper && (
        <section className="super-selector" aria-labelledby="super-selector-heading">
        <div className="super-selector-heading">
          <span className="eyebrow">{guardianClass.name} · {subclass.name}</span>
          <h4 id="super-selector-heading">Elige tu super</h4>
          <p>Selecciona una habilidad para ver su icono y un fragmento breve de gameplay.</p>
        </div>
        <div className="super-ability-grid" role="group" aria-label={`Supers de ${guardianClass.name} ${subclass.name}`}>
          {availableSupers.map((superId) => {
            const ability = SUPER_DETAILS[superId];
            return (
              <button
                aria-pressed={activeSuperId === superId}
                className={`super-ability-card${activeSuperId === superId ? " super-ability-card-active" : ""}`}
                key={superId}
                onClick={() => setSelectedSuper(superId)}
                type="button"
              >
                <img alt="" className="super-ability-icon" src={`${BUNGIE_ICON_ORIGIN}${ability.icon}`} />
                <strong>{ability.name}</strong>
                <span>{activeSuperId === superId ? "SELECCIONADA" : "VER SUPER"}</span>
              </button>
            );
          })}
        </div>
        <div className="super-selected-preview" aria-live="polite">
          <div className="super-selected-copy">
            <span className="eyebrow">SUPER SELECCIONADA</span>
            <img alt="" className="super-selected-icon" src={`${BUNGIE_ICON_ORIGIN}${activeSuper.icon}`} />
            <h5>{activeSuper.name}</h5>
            <p>{guardianClass.name} · {subclass.name}</p>
            <p className="super-selected-description">{activeSuper.description}</p>
          </div>
          <div className="super-video-frame">
            <iframe
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              key={activeSuperId}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={superVideoUrl}
              title={`Gameplay de ${activeSuper.name} en Destiny 2`}
            />
          </div>
        </div>
        </section>
      )}

      {selectedClass && subclass && (
        <p className="class-selector-note">
          Emblemas de clase locales e iconos de habilidad del manifiesto de Bungie. Fragmentos de gameplay:{" "}
          <a href={`https://www.youtube.com/watch?v=${SUPER_SHOWCASE_VIDEO}`} rel="noreferrer" target="_blank">recopilación de supers de thatguyHoody en YouTube</a>.
        </p>
      )}
    </section>
  );
}
