import type { CatalogEntry } from "../types/lore";

export interface Destiny2MapLocation {
  id: string;
  title: string;
  aliases: readonly string[];
  left: number | null;
  top: number | null;
  summary: string;
  era: "actual" | "legado";
  showOnMap?: boolean;
  artworkUrl?: string;
  wiki: string;
}

const DESTINY2_DESTINATIONS_PATH = "/media/site-art/destinos/destiny2/";

export const DESTINY2_MAP_LOCATIONS: readonly Destiny2MapLocation[] = [
  {
    id: "tower",
    title: "La Torre",
    aliases: ["the tower", "tower", "la torre"],
    left: 50,
    top: 70,
    summary: "Centro social de la Última Ciudad y sede de la Vanguardia, donde los Guardianes se preparan para sus misiones.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}torre.jpg`,
    wiki: "The_Tower",
  },
  {
    id: "edz",
    title: "Zona Muerta Europea",
    aliases: ["european dead zone", "edz", "zona muerta europea"],
    left: 35,
    top: 70,
    summary: "Región de la Tierra ocupada por los Caídos y los Cabal. La iglesia de Trostland y la quebrada son puntos de reunión de los Guardianes.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}zona%20muerta.jpg`,
    wiki: "European_Dead_Zone",
  },
  {
    id: "cosmodrome",
    title: "Cosmódromo",
    aliases: ["cosmodrome", "cosmodromo", "old russia", "antigua rusia"],
    left: 66,
    top: 70,
    summary: "Antiguo puerto espacial de la Tierra: sus instalaciones abandonadas conservan las huellas del éxodo de la Edad de Oro.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}Cosmodrome.webp`,
    wiki: "Cosmodrome",
  },
  {
    id: "moon",
    title: "Luna",
    aliases: ["the moon", "moon", "luna", "ocean of storms", "oceano de las tormentas"],
    left: 17,
    top: 75,
    summary: "La Colmena excavó bajo la superficie lunar y levantó una fortaleza en el Océano de las Tormentas.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}luna.jpg`,
    wiki: "Moon",
  },
  {
    id: "europa",
    title: "Europa",
    aliases: ["europa", "charon crossing", "cruce de caronte"],
    left: 12,
    top: 24,
    summary: "Luna helada de Júpiter y hogar de los Exos. Las ruinas de las instalaciones de BrayTech esconden secretos de la Edad de Oro.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}europa.jpg`,
    wiki: "Europa",
  },
  {
    id: "nessus",
    title: "Nessus",
    aliases: ["nessus", "arcadian valley", "valle arcadiano"],
    left: 36,
    top: 19,
    summary: "Planetoide fracturado que los Vex transforman sin descanso; la nave Leviatán de Calus llegó a consumir parte de su núcleo.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}nessus.jpg`,
    wiki: "Nessus",
  },
  {
    id: "dreaming-city",
    title: "Ciudad Ensoñada",
    aliases: ["dreaming city", "ciudad ensonada", "ciudad onirica"],
    left: 68,
    top: 18,
    summary: "Ciudad oculta de los Insomnes en el corazón del Arrecife, atrapada en un ciclo de maldición ligado a Riven.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}ciudad%20onirica.jpg`,
    wiki: "Dreaming_City",
  },
  {
    id: "tangled-shore",
    title: "Costa Enredada",
    aliases: ["tangled shore", "costa enredada"],
    left: null,
    top: null,
    summary: "Laberinto de asteroides del Arrecife y antiguo territorio de los Barones Caídos.",
    era: "legado",
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}enredada.webp`,
    wiki: "Tangled_Shore",
  },
  {
    id: "throne-world",
    title: "Mundo Trono de Savathûn",
    aliases: ["savathun's throne world", "savathun throne world", "throne world", "mundo trono"],
    left: 82,
    top: 43,
    summary: "Dominio de Savathûn en los confines de Marte, donde la Colmena Lúcida protege los secretos de la Reina Bruja.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}mundo%20trono.webp`,
    wiki: "Savathun%27s_Throne_World",
  },
  {
    id: "neomuna",
    title: "Neomuna",
    aliases: ["neomuna", "neptune", "neptuno", "liming harbor", "puerto liming"],
    left: 27,
    top: 43,
    summary: "Ciudad secreta de Neptuno, protegida durante siglos por los defensores conocidos como los Cloud Striders.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}1200px-Neomuna1.webp`,
    wiki: "Neomuna",
  },
  {
    id: "pale-heart",
    title: "Corazón Pálido",
    aliases: ["pale heart", "corazon palido"],
    left: 50,
    top: 37,
    summary: "Paisaje imposible dentro del Viajero, formado por recuerdos de la humanidad y marcado por la lucha contra el Testigo.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}destiny-2-the-final-shape-pale-heart-solo-1.webp`,
    wiki: "Pale_Heart",
  },
  {
    id: "titan",
    title: "Titán",
    aliases: ["titan", "new pacific arcology", "arcologia del nuevo pacifico"],
    left: null,
    top: null,
    summary: "Luna oceánica de Saturno cuyas plataformas de la Edad de Oro quedaron cubiertas por mares de metano y actividad de la Colmena.",
    era: "legado",
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}Destiny2_Titan01.webp`,
    wiki: "Titan",
  },
  {
    id: "io",
    title: "Ío",
    aliases: ["io", "the cradle", "la cuna"],
    left: null,
    top: null,
    summary: "Último mundo visitado por el Viajero antes del Colapso y uno de los lugares más sagrados para los Hechiceros.",
    era: "legado",
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}io.webp`,
    wiki: "Io",
  },
  {
    id: "mercury",
    title: "Mercurio",
    aliases: ["mercury", "mercurio", "infinite forest", "bosque infinito"],
    left: null,
    top: null,
    summary: "El Bosque Infinito vex podía simular incontables futuros desde la superficie de Mercurio.",
    era: "legado",
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}mercurio.webp`,
    wiki: "Mercury",
  },
  {
    id: "mars",
    title: "Marte",
    aliases: ["mars", "hellas basin", "cuenca de hellas"],
    left: null,
    top: null,
    summary: "La Cuenca de Hellas y las instalaciones de Rasputín marcaron la historia de la humanidad en Marte.",
    era: "legado",
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}marte.jpg`,
    wiki: "Mars",
  },
  {
    id: "reef",
    title: "El Arrecife",
    aliases: ["the reef", "reef", "el arrecife", "arrecife"],
    left: null,
    top: null,
    summary: "Asentamiento de los Insomnes entre los asteroides, gobernado por la Reina Mara Sov.",
    era: "legado",
    showOnMap: false,
    artworkUrl: "/media/site-art/destinos/destiny1/Destiny-Reef-Social-Space-Dock.avif",
    wiki: "The_Reef",
  },
  {
    id: "eternity",
    title: "Eternidad",
    aliases: ["eternity", "eternity destination", "destino eternidad"],
    left: 67,
    top: 40,
    summary: "Dominio de los Nueve en un espacio ajeno al sistema solar, escenario de actividades y desafíos especiales.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}eternidad.webp`,
    wiki: "Eternity",
  },
  {
    id: "derelict-leviathan",
    title: "Leviatán abandonado",
    aliases: ["derelict leviathan", "leviatan abandonado"],
    left: null,
    top: null,
    summary: "La nave de Calus regresó infestada por la influencia de la Pesadilla, suspendida sobre la Luna.",
    era: "legado",
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}Leviathan-Ship.webp`,
    wiki: "Derelict_Leviathan",
  },
  {
    id: "kepler",
    title: "Kepler",
    aliases: ["kepler"],
    left: 86,
    top: 24,
    summary: "Destino remoto en los confines del sistema, donde los Guardianes investigan una anomalía que altera el espacio conocido.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}kepler.avif`,
    wiki: "Kepler",
  },
  {
    id: "lawless-frontier",
    title: "Frontera Sin Ley",
    aliases: ["lawless frontier", "frontera sin ley"],
    left: 83,
    top: 62,
    summary: "Región marciana de frontera donde los Guardianes se adentran en un territorio hostil para afrontar nuevas amenazas.",
    era: "actual",
    showOnMap: true,
    artworkUrl: `${DESTINY2_DESTINATIONS_PATH}sin%20ley.jpg`,
    wiki: "Mars",
  },
] as const;

const DESTINATION_ARTWORK = [
  {
    aliases: ["cosmodrome", "old russia", "the city perimeter", "perimeter of the city"],
    src: "/media/site-art/destinos/destiny1/Official_Destiny_E3_Gameplay_Trailer_Tierra_Antigua_Rusia_Cosmodromo_0.png",
    lore: "En la Antigua Rusia, el Cosmódromo fue el punto de partida de las naves coloniales durante la Edad de Oro. Siglos después, sus instalaciones quedaron en ruinas y se convirtieron en territorio disputado por los Caídos.",
    wiki: "Cosmodrome",
  },
  {
    aliases: ["dreadnaught", "the dreadnaught"],
    src: "/media/site-art/destinos/destiny1/acorazado.jpg",
    lore: "El Acorazado es la enorme nave-fortaleza de Oryx. Desde ella, el Rey de los Poseídos extendió su guerra por el sistema y amenazó a la humanidad.",
    wiki: "Dreadnaught",
  },
  {
    aliases: ["mars", "marte", "meridian bay", "bahia del meridiano"],
    src: "/media/site-art/destinos/destiny1/marte.png",
    lore: "En Marte, la región de la Cuenca de Meridian quedó bajo control de la Legión Roja. Sus ruinas y operaciones cabal esconden vestigios de la Edad de Oro.",
    wiki: "Mars",
  },
  {
    aliases: ["moon", "luna"],
    src: "/media/site-art/destinos/destiny1/lina.png",
    lore: "La Colmena excavó bajo la superficie lunar y abrió la Boca del Infierno, una vasta red de túneles desde la que preparó su avance contra la Tierra.",
    wiki: "Moon",
  },
  {
    aliases: ["phobos"],
    src: "/media/site-art/destinos/destiny1/300px-Grimoire_Fleetbase_Korus,_Phobos.png",
    lore: "Fobos fue una posición cabal en la que la Vanguardia detectó una amenaza de los Poseídos. La señal marcó el inicio de la campaña contra Oryx.",
    wiki: "Phobos",
  },
  {
    aliases: ["reef", "the reef", "arrecife", "el arrecife", "asteroid belt"],
    src: "/media/site-art/destinos/destiny1/Destiny-Reef-Social-Space-Dock.avif",
    lore: "El Arrecife, asentado entre los asteroides, es el hogar de los Insomnes. La Reina Mara Sov y su pueblo se convirtieron en aliados decisivos frente a la amenaza de Oryx.",
    wiki: "The_Reef",
  },
  {
    aliases: ["tower", "the tower", "torre"],
    src: "/media/site-art/destinos/destiny1/TowerPlaza.png",
    lore: "La Torre se alza sobre la Última Ciudad y sirve como centro de mando de la Vanguardia. Desde sus murallas, los Guardianes protegen a la humanidad bajo la mirada del Viajero.",
    wiki: "The_Tower",
  },
  {
    aliases: ["venus"],
    src: "/media/site-art/destinos/destiny1/venusa.jpg",
    lore: "El Ishtar Sink de Venus conserva las ruinas de una colonia humana de la Edad de Oro. Los Vex ocuparon sus estructuras y construyeron portales hacia sus dominios.",
    wiki: "Venus",
  },
  {
    aliases: ["mercury", "mercurio", "caloris spires", "espiras caloris"],
    src: "/media/site-art/destinos/destiny1/mercuirio.png",
    lore: "En Destiny, Mercurio aparece en mapas del Crisol y está ligado al Faro, un lugar asociado a los Insomnes y a las Pruebas de Osiris.",
    wiki: "Mercury",
  },
] as const;

function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getDestiny2MapLocation(title: string): Destiny2MapLocation | null {
  const normalizedTitle = ` ${normalizeTitle(title)} `;
  return DESTINY2_MAP_LOCATIONS.find(({ aliases }) =>
    aliases.some((alias) => normalizedTitle.includes(` ${normalizeTitle(alias)} `)),
  ) ?? null;
}

export function getDestinationDescription(entry: CatalogEntry): string | null {
  if (entry.sourceGame === "destiny2") {
    return getDestiny2MapLocation(`${entry.title} ${entry.titleEn}`)?.summary ?? null;
  }
  return getDestinationLore(entry)?.summary ?? null;
}

export function isDestinationActivity(entry: CatalogEntry): boolean {
  if (entry.category !== "places") return true;

  const title = normalizeTitle(`${entry.title} ${entry.titleEn} ${entry.itemType ?? ""}`);
  return /\b(trials of osiris|pruebas de osiris|crucible|crisol|strike|assault|asalto|mission|missions|mision|misiones|playlist|lista de juego|assassination|asesinato)\b/.test(title);
}

export function isExcludedDestination(entry: CatalogEntry): boolean {
  if (entry.sourceGame !== "destiny1") return false;

  const title = normalizeTitle(`${entry.title} ${entry.titleEn}`);
  return /\b(expansion destination|destino de expansion|vault of glass|glass chamber|camara de cristal|camara|earth|tierra|the last city|ultima ciudad)\b/.test(title);
}

export function getDestinationLore(entry: CatalogEntry): { summary: string; sourceUrl: string } | null {
  if (isDestinationActivity(entry)) return null;

  const title = normalizeTitle(`${entry.title} ${entry.titleEn}`);
  if (entry.sourceGame === "destiny2") {
    const destination = DESTINY2_MAP_LOCATIONS.find(({ aliases }) =>
      aliases.some((alias) => title.includes(normalizeTitle(alias))),
    );
    if (!destination) return null;
    return {
      summary: destination.summary,
      sourceUrl: `https://www.destinypedia.com/${destination.wiki}`,
    };
  }

  const destination = DESTINATION_ARTWORK.find(({ aliases }) =>
    aliases.some((alias) => title.includes(normalizeTitle(alias))),
  );
  if (!destination) return null;
  return { summary: destination.lore, sourceUrl: `https://www.destinypedia.com/${destination.wiki}` };
}

export function getDestinationArtworkUrl(entry: CatalogEntry): string | null {
  if (isDestinationActivity(entry)) return null;

  const title = normalizeTitle(`${entry.title} ${entry.titleEn}`);
  if (entry.sourceGame === "destiny2") {
    return DESTINY2_MAP_LOCATIONS.find(({ aliases }) =>
      aliases.some((alias) => title.includes(normalizeTitle(alias))),
    )?.artworkUrl ?? null;
  }

  const artwork = DESTINATION_ARTWORK.find(({ aliases }) =>
    aliases.some((alias) => title.includes(normalizeTitle(alias))),
  );

  return artwork?.src ?? null;
}
