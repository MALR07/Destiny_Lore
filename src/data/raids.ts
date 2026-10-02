export interface RaidEncounter {
  name: string;
  guide: string;
}

export interface RaidDefinition {
  id: string;
  game: "destiny1" | "destiny2";
  title: string;
  titleEn: string;
  releaseSlug: string;
  label: string;
  summary: string;
  rewards: string[];
  encounters: RaidEncounter[];
}

export const raids: RaidDefinition[] = [
  {
    id: "vault-of-glass-d1", game: "destiny1", title: "La Cámara de Cristal", titleEn: "Vault of Glass",
    releaseSlug: "destiny", label: "DESTINY ORIGINAL",
    summary: "Desciende a las ruinas vex de Venus, sobrevive a las pruebas de los oráculos y derrota a Atheon, el Conflujo del Tiempo.",
    rewards: ["Fatebringer", "Vision of Confluence", "Praedyth's Revenge", "Praedyth's Timepiece", "Found Verdict", "Corrective Measure", "Hezen Vengeance", "Praetorian Foil", "Atheon's Epilogue", "Vex Mythoclast", "Armadura de la Cámara de Cristal"],
    encounters: [
      { name: "Construir la Aguja", guide: "Separa al equipo entre las tres placas del patio. Mantén cada placa bajo control y derrota a los vex que intentan recuperarla hasta que la aguja abra el acceso." },
      { name: "Confluencias", guide: "Defiende las confluencias por orden. Divide el equipo para cubrir los accesos, elimina a los fanáticos antes de que alcancen la placa y recoge sus marcas entrando en la luz." },
      { name: "Oráculos y Templario", guide: "Aprende el orden de aparición de los oráculos y destrúyelos en secuencia. En el daño al Templario, una persona recoge la Égida y bloquea su teletransporte mientras el resto rompe su escudo." },
      { name: "Guardián de la Puerta", guide: "Activa los portales de Marte y Venus, elimina al guardián de cada lado y lleva su Égida al centro. Coordina las rotaciones cuando el equipo intercambie dimensiones." },
      { name: "Atheon", guide: "Tras la teletransportación, el equipo dentro anuncia los oráculos en orden y limpia la sala con la Égida. Al volver, reúne al grupo en el punto de daño, destruye a Atheon durante la ventana y repite." },
    ],
  },
  {
    id: "crotas-end-d1", game: "destiny1", title: "El Fin de Crota", titleEn: "Crota's End",
    releaseSlug: "the-dark-below", label: "LA PROFUNDA OSCURIDAD",
    summary: "Atraviesa el Abismo, cruza el puente de la Colmena y abre camino hasta la cámara de Crota en la Luna.",
    rewards: ["Abyss Defiant", "Oversoul Edict", "Fang of Ir Yût", "Swordbreaker", "Word of Crota", "Hunger of Crota", "Black Hammer", "Light of the Abyss", "Song of Ir Yût", "Armadura del Fin de Crota", "Necrochasm (búsqueda exótica)"],
    encounters: [
      { name: "El Abismo", guide: "Avanza entre las lámparas evitando que la acumulación de oscuridad te inmovilice. Activa cada lámpara como zona segura, controla a los perseguidores y cruza el abismo en grupo." },
      { name: "El Puente", guide: "Mantén las placas para formar el puente y elimina a los enemigos que amenazan a los portadores de espada. Cruza con las espadas, derrota a los campeones del otro lado y reúne al equipo." },
      { name: "Ir Yût, la Cantora de la Muerte", guide: "El equipo se divide para despejar las salas laterales y abrir el acceso a la Cantora. Elimina a los ogros y magos que habilitan la fase; concentra el daño durante su canto." },
      { name: "Crota, Hijo de Oryx", guide: "Rompe el escudo de Crota para crear la ventana de espada. El portador golpea al jefe mientras el resto controla a los ogros y caballeros; coordina las rondas de espada y el final." },
    ],
  },
  {
    id: "kings-fall-d1", game: "destiny1", title: "Caída del Rey", titleEn: "King's Fall",
    releaseSlug: "the-taken-king", label: "EL REY DE LOS POSEÍDOS",
    summary: "Asalta la nave de Oryx, supera las pruebas de la Cámara de la Noche y enfréntate al Rey de los Poseídos.",
    rewards: ["Smite of Merain", "Defiance of Yasmin", "Anguish of Drystan", "Doom of Chelchis", "Zaouli's Bane", "Qullim's Terminus", "Silence of A'Arn", "Midha's Reckoning", "Elulim's Frenzy", "Touch of Malice", "Armadura de Caída del Rey"],
    encounters: [
      { name: "La Corte de Oryx y las naves", guide: "Carga las reliquias y deposítalas simultáneamente en las estatuas para abrir el portal. En el cruce de naves, coordina los saltos y activa los puntos de control en el recorrido." },
      { name: "Los Tótems", guide: "Alterna a los jugadores entre las placas y los tótems para transferir la marca de Tejedor de la Luz. Descarga las acumulaciones en el centro y destruye la barrera antes de que se agote el tiempo." },
      { name: "Sacerdote de Guerra", guide: "Recoge la marca siguiendo la secuencia de placas y pasa el aura al siguiente jugador antes de que expire. El equipo sin marca despeja enemigos; todos disparan al jefe durante el aura." },
      { name: "Golgoroth", guide: "Rompe una burbuja del techo y coloca al equipo en la piscina de luz. El portador de la mirada mantiene al ogro mirando hacia fuera mientras el resto dispara al punto débil; rota la mirada a tiempo." },
      { name: "Hijas de Oryx", guide: "Sigue el recorrido de plataformas y recoge fragmentos de la chispa en el orden indicado. El jugador designado completa el salto final y recibe el aura para abrir la ventana de daño a la hija marcada." },
      { name: "Oryx", guide: "Rompe el barco, recoge la chispa y libera a los ogros poseídos en las esquinas. Detónalos junto a las placas cuando Oryx aturda; el equipo limpia la explosión y repite hasta la fase final." },
    ],
  },
  {
    id: "wrath-of-the-machine", game: "destiny1", title: "Ira de las Máquinas", titleEn: "Wrath of the Machine",
    releaseSlug: "rise-of-iron", label: "LOS SEÑORES DE HIERRO",
    summary: "Persigue a los Caídos hasta la Cámara de Replicación y detén la propagación de SIVA.",
    rewards: ["Genesis Chain", "Steel Medulla", "Fever and Remedy", "Chaos Dogma", "Ex Machina", "Zeal Vector", "Ether Nova", "Quantiplasm", "Sound and Fury", "Armadura de la Ira de las Máquinas", "Outbreak Prime (búsqueda exótica)"],
    encounters: [
      { name: "Asedio a la Muralla", guide: "Recoge las cargas SIVA y lánzalas a los generadores de la puerta. Mantén el avance del tanque al despejar los bloqueos y protege a quien coloca cada carga." },
      { name: "Vosik, el Arconte", guide: "Lanza las cargas a Vosik para bajar su escudo. Cuando active la purga, entra en una de las salas seguras y dispara al panel de cierre; repite el ciclo y remátalo." },
      { name: "Motor de Asedio", guide: "Persigue el motor caído, recoge las piezas necesarias y llévalas a sus puntos de montaje. Repara el vehículo antes de que se agote el tiempo y despeja la ruta." },
      { name: "Aksis, Arconte Primigenio", guide: "Derrota a los servidores para obtener cargas y lánzalas a los puntos señalados. Los teletransportadores aturden a Aksis: asigna a los jugadores para cada lado y dispara durante la ventana." },
    ],
  },
  {
    id: "leviathan", game: "destiny2", title: "Leviatán", titleEn: "Leviathan",
    releaseSlug: "destiny-2", label: "LEGADO · RETIRADA DEL JUEGO",
    summary: "Explora el Leviatán de Calus y completa sus pruebas antes de enfrentarte al emperador.",
    rewards: ["Midnight Coup", "Inaugural Address", "Alone as a God", "Sins of the Past", "Conspirator", "Mob Justice", "Armaduras del Leviatán", "Legend of Acrius (búsqueda exótica)"],
    encounters: [
      { name: "Castellum", guide: "Los portadores de estandarte limpian las posiciones y llevan las insignias a la puerta. El equipo restante defiende a los portadores; repite la mecánica en cada acceso." },
      { name: "Baños Reales", guide: "Activa las placas exteriores por parejas y recoge los orbes del agua para refrescar el temporizador. Reúne las cargas en el centro, destruye los incensarios y repite el ciclo." },
      { name: "Jardines del Placer", guide: "Los guías conducen a los portadores de esporas por rutas seguras mientras el resto distrae a las bestias. Reúne las esporas para potenciar el daño y derrota a las bestias antes de que escapen." },
      { name: "El Guantelete", guide: "Corre por el circuito recogiendo orbes y activa los nodos correctos según las señales de tus compañeros. Deposita los orbes en el centro y completa las rondas requeridas." },
      { name: "Calus", guide: "El equipo separado comunica los símbolos y elimina al psiónico indicado; el grupo del trono despeja enemigos y carga el cráneo. Reúne las fuerzas para dañar a Calus y rompe su escudo en cada ciclo." },
    ],
  },
  {
    id: "eater-of-worlds", game: "destiny2", title: "Devorador de Mundos", titleEn: "Eater of Worlds",
    releaseSlug: "curse-of-osiris", label: "LEGADO · RETIRADA DEL JUEGO",
    summary: "Adéntrate en el Leviatán y desmantela el motor vex Argos antes de que consuma el planetoide.",
    rewards: ["I Am Alive", "Zenith of Your Kind", "Catalizador de Telesto", "Armadura de Devorador de Mundos"],
    encounters: [
      { name: "Entrada al motor", guide: "Salta entre los fragmentos del planetoide, activa los mecanismos y abre camino por los anillos. Mantén el ritmo del grupo y espera a quienes deban accionar cada plataforma." },
      { name: "Argos, núcleo planetario", guide: "Recoge las reliquias elementales y colócalas en los puntos del escudo según el patrón mostrado. Rompe el escudo, destruye los puntos débiles del jefe y repite las fases de daño." },
    ],
  },
  {
    id: "spire-of-stars", game: "destiny2", title: "Espira de Estrellas", titleEn: "Spire of Stars",
    releaseSlug: "warmind", label: "LEGADO · RETIRADA DEL JUEGO",
    summary: "Aborda la nave de Calus y detén el golpe de estado de Val Ca'uor.",
    rewards: ["Emperor's Envy", "Last of the Legion", "Catalizador de Sleeper Simulant", "Armadura de Espira de Estrellas"],
    encounters: [
      { name: "Castellum", guide: "Consigue estandartes, deposítalos en las placas y defiende cada posición de las oleadas. Coordina el relevo entre los equipos para completar la apertura." },
      { name: "Ascenso", guide: "Usa las placas de lanzamiento para cruzar la estructura y derrota a los centuriones que protegen la ruta. Activa los puntos de control y agrupa al equipo en la plataforma final." },
      { name: "Val Ca'uor", guide: "Carga las esferas con energía solar y lánzalas a los compañeros que puedan transferirlas a la nave. Rompe el escudo de Ca'uor con las esferas coordinadas y aprovecha la ventana de daño." },
    ],
  },
  {
    id: "last-wish", game: "destiny2", title: "Último Deseo", titleEn: "Last Wish",
    releaseSlug: "forsaken", label: "LOS RENEGADOS",
    summary: "Rompe la maldición de la Ciudad Ensoñada y derrota a Riven, la última Ahamkara conocida.",
    rewards: ["Chattering Bone", "Transfiguration", "Nation of Beasts", "Tyranny of Heaven", "The Supremacy", "Techeun Force", "Apex Predator", "One Thousand Voices", "Armadura del Último Deseo"],
    encounters: [
      { name: "Kalli", guide: "Identifica el símbolo pedido y activa las placas correspondientes. Durante la fase de daño, entra en la cámara segura cuando Kalli anuncie la aniquilación y sal para continuar el ciclo." },
      { name: "Shuro Chi", guide: "Lee los símbolos, recoge los prismas y dispara a los compañeros para completar los triángulos. Derrota a los enemigos dentro del tiempo y resuelve las salas de plataformas antes de que termine el temporizador." },
      { name: "Morgeth", guide: "Recoge las motas de fuerza tomadas y libera a los compañeros atrapados con el efecto de Tejedor de Luz. Evita acumular demasiada fuerza; usa el potenciador para detener al ogro y abrir daño." },
      { name: "Bóveda", guide: "Lee los símbolos de las placas y asigna quién limpia con Penumbra o Antumbra. Derrota al caballero de la placa correcta, deposita la esencia y completa las tres rondas." },
      { name: "Riven", guide: "Separa el equipo entre las dos torres, comunica ojos y símbolos y aturde a Riven en el orden acordado. Entra en su boca para destruir los ojos correctos, completa la caída y repite hasta la fase final." },
      { name: "Paseo de las Reinas", guide: "Un jugador lleva la fuerza de Riven y el equipo se mantiene unido mientras atraviesa la Ciudad Ensoñada. Pasa la carga antes de que expire y deposita las cargas finales en la bóveda." },
    ],
  },
  {
    id: "scourge-of-the-past", game: "destiny2", title: "Azote del Pasado", titleEn: "Scourge of the Past",
    releaseSlug: "season-of-the-forge", label: "LEGADO · RETIRADA DEL JUEGO",
    summary: "Persigue a los Caídos por la Última Ciudad y frustra el plan de la Casa de los Demonios.",
    rewards: ["Threat Level", "No Feelings", "Tempered Dynamo", "Bellowing Giant", "Stryker's Sure-Hand", "Anarchy", "Armadura del Azote del Pasado"],
    encounters: [
      { name: "Distrito Botza", guide: "Usa el mapa para localizar al Berserker, separa a los equipos por color y dispara a sus puntos débiles frontal y dorsal. Deposita las cargas en los conductos del mismo color." },
      { name: "Insurrección Prime: asalto", guide: "Desactiva los escudos de los tanques emparejando los operadores con los puntos de color. Carga los núcleos, destruye los generadores y evita las zonas de bombardeo." },
      { name: "Insurrección Prime: jefe", guide: "El equipo se reparte en los puestos de operador, explorador y defensa. Activa los terminales siguiendo las señales, carga los núcleos y aprovecha la ventana en que el jefe queda expuesto." },
    ],
  },
  {
    id: "crown-of-sorrow", game: "destiny2", title: "Corona del Dolor", titleEn: "Crown of Sorrow",
    releaseSlug: "season-of-opulence", label: "LEGADO · RETIRADA DEL JUEGO",
    summary: "Desciende a las profundidades del Leviatán para detener a Gahlran y la corrupción de la Colmena.",
    rewards: ["Gahlran's Right Hand", "Emperor's Courtesy", "Calusea Noblesse", "Bane of Sorrow", "Tarrabah", "Armadura de la Corona del Dolor"],
    encounters: [
      { name: "Puente de la Maldición", guide: "Comparte el potenciador de la bruja entre parejas para romper cristales y derrotar a los caballeros protegidos. Avanza por las placas sin dejar que expire el efecto." },
      { name: "Gahlran, engaño", guide: "Separa al equipo en parejas potenciadas y no potenciadas. Rompe los cristales a la vez, comunica las posiciones del engaño y aturde al enemigo falso con los jugadores potenciados." },
      { name: "Gahlran, maestro del engaño", guide: "Coordina el potenciador entre salas para romper los cristales simultáneamente. Aturde cada copia de Gahlran y dispara a la cabeza del jefe real durante las ventanas de daño." },
    ],
  },
  {
    id: "garden-of-salvation", game: "destiny2", title: "Jardín de la Salvación", titleEn: "Garden of Salvation",
    releaseSlug: "shadowkeep", label: "BASTIÓN DE SOMBRAS",
    summary: "Sigue la señal de la Oscuridad hasta el Jardín Negro y enfréntate a los Vex Sol Divisivos.",
    rewards: ["Sacred Provenance", "Ancient Gospel", "Reckless Oracle", "Prophet of Doom", "Zealot's Reward", "Omniscient Eye", "Divinity (búsqueda exótica)", "Armadura del Jardín de la Salvación"],
    encounters: [
      { name: "Evade la mente consagrada", guide: "Conduce al jefe y a los enemigos por el recorrido, derrota a los minotauros y recoge motas para depositarlas en el receptáculo. Activa portales con el equipo de apoyo y defiende el punto." },
      { name: "Mente consagrada", guide: "Dispara al ojo marcado para atraer al jefe y comunica el color del ojo que debe destruirse. Recoge motas del minotauro, deposítalas y daña al jefe cuando se detenga." },
      { name: "Mente santificada", guide: "Forma equipos para recoger motas y defender el cubo mientras el resto repara los puentes con ataduras. Deposita las motas en el receptáculo correcto y dispara al jefe durante la fase de daño." },
    ],
  },
  {
    id: "deep-stone-crypt", game: "destiny2", title: "Cripta de la Piedra Profunda", titleEn: "Deep Stone Crypt",
    releaseSlug: "beyond-light", label: "MÁS ALLÁ DE LA LUZ",
    summary: "Infiltra la instalación de BrayTech en Europa y detén a Taniks antes de que alcance la Última Ciudad.",
    rewards: ["Succession", "Heritage", "Posterity", "Trustee", "Bequest", "Eyes of Tomorrow", "Armadura de la Cripta de la Piedra Profunda"],
    encounters: [
      { name: "Seguridad de la Cripta", guide: "El operador identifica los paneles rojos desde el cristal mientras el escáner señala los amarillos desde abajo. Pasa los potenciadores por los tubos y dispara los paneles en el orden comunicado." },
      { name: "Atraks-1", guide: "El equipo de arriba elimina las copias mientras el equipo del espacio recoge potenciadores y lanza los núcleos al espacio. Identifica la copia real, expulsa el replicante y repite la secuencia de daño." },
      { name: "Descenso", guide: "El operador dispara los paneles señalados y el escáner localiza los receptáculos correctos para las cargas. Lanza los núcleos al espacio y cambia los potenciadores al bajar de nivel." },
      { name: "Taniks, la Abominación", guide: "Recoge núcleos de las cápsulas, deposítalos en los contenedores válidos y gestiona los potenciadores entre el equipo. Cuando Taniks quede aturdido, reúne al grupo en la zona segura y dispara." },
    ],
  },
  {
    id: "vault-of-glass-d2", game: "destiny2", title: "La Cámara de Cristal", titleEn: "Vault of Glass",
    releaseSlug: "season-of-the-splicer", label: "REGRESO · TEMPORADA DEL SIMBIONTE",
    summary: "Regresa a Venus y afronta la incursión vex clásica, reintroducida en Destiny 2.",
    rewards: ["Fatebringer", "Vision of Confluence", "Praedyth's Revenge", "Found Verdict", "Corrective Measure", "Hezen Vengeance", "Vex Mythoclast", "Armadura de la Cámara de Cristal"],
    encounters: [
      { name: "Construir la Aguja", guide: "Separa al equipo entre las tres placas del patio. Mantén cada placa bajo control y derrota a los vex que intentan recuperarla hasta que la aguja abra el acceso." },
      { name: "Confluencias y oráculos", guide: "Defiende las confluencias por orden y evita que los fanáticos marquen a los jugadores. En los oráculos, aprende la secuencia y destruye cada aparición en el orden anunciado." },
      { name: "Templario", guide: "La Égida limpia la marca de negación y bloquea los teletransportes del Templario. Destruye los oráculos en orden y dispara al jefe durante las ventanas seguras." },
      { name: "Guardián de la Puerta", guide: "Activa portales, derrota a los guardianes y lleva la Égida al centro. Rota entre Marte y Venus para que el equipo mantenga ambos lados bajo control." },
      { name: "Atheon", guide: "El equipo teletransportado lee los oráculos en secuencia mientras la Égida limpia las marcas. Al regresar, agrúpate en el punto de daño y aprovecha la ventana temporal para atacar." },
    ],
  },
  {
    id: "vow-of-the-disciple", game: "destiny2", title: "Voto del Discípulo", titleEn: "Vow of the Disciple",
    releaseSlug: "the-witch-queen", label: "LA REINA BRUJA",
    summary: "Irrumpe en la Pirámide de Savathûn y descubre el secreto de Rhulk, el primer Discípulo.",
    rewards: ["Submission", "Deliverance", "Forbearance", "Insidious", "Cataclysmic", "Lubrae's Ruin", "Collective Obligation", "Armadura del Voto del Discípulo"],
    encounters: [
      { name: "Adquisición", guide: "Lee los símbolos del monolito y comunica los que aparecen en cada sala. Derrota a los guardianes con el símbolo correcto y dispara a los obeliscos antes de que se agote el tiempo." },
      { name: "Cuidador", guide: "Un equipo recoge símbolos en la sala y otro limpia los puntos débiles del jefe. Aturde al Cuidador disparando a sus placas, sube por los pisos y daña la cabeza al final." },
      { name: "Exhibición", guide: "Rota entre salas usando las reliquias: la espada rompe escudos, el prisma elimina a los guardianes y la lanza limpia marcas. Lee símbolos, abre las puertas y evita que expire el temporizador." },
      { name: "Rhulk", guide: "Dispara a los puntos débiles para cargar la energía y recibe el potenciador del jefe. Destruye los cristales, deposita las cargas en el obelisco correcto y aprovecha las fases de daño antes del final." },
    ],
  },
  {
    id: "kings-fall-d2", game: "destiny2", title: "Caída del Rey", titleEn: "King's Fall",
    releaseSlug: "season-of-plunder", label: "REGRESO · TEMPORADA DE LOS TESOROS",
    summary: "Vuelve al Acorazado para detener a Oryx en la versión de Destiny 2 de la incursión.",
    rewards: ["Doom of Chelchis", "Zaouli's Bane", "Smite of Merain", "Defiance of Yasmin", "Qullim's Terminus", "Midha's Reckoning", "Touch of Malice", "Armadura de Caída del Rey"],
    encounters: [
      { name: "La Corte de Oryx y las naves", guide: "Deposita las reliquias en las estatuas de forma coordinada. En el cruce, salta entre las naves y activa los puntos de control para que el equipo pueda avanzar." },
      { name: "Los Tótems", guide: "Alterna a los jugadores entre placas y tótems para transferir la marca. Descarga acumulaciones en el centro y destruye la barrera antes de que el equipo pierda el control." },
      { name: "Sacerdote de Guerra", guide: "Activa las placas en el orden correcto, pasa la marca y derrota a los enemigos que amenazan al portador. Agrupa al equipo en el aura para cada fase de daño." },
      { name: "Golgoroth", guide: "Rompe una burbuja para crear la piscina de luz; el portador de la mirada mantiene al ogro orientado. Rota la mirada y dispara al punto débil desde la piscina." },
      { name: "Hijas de Oryx", guide: "Sigue las plataformas, recoge los fragmentos de chispa y termina el recorrido de la jugadora marcada. Usa el aura obtenida para dañar a la hija correspondiente." },
      { name: "Oryx", guide: "Derrota al barco, recoge la chispa y coloca ogros en sus placas. Detona las cargas juntas cuando Oryx quede aturdido y repite el ciclo hasta derrotarlo." },
    ],
  },
  {
    id: "root-of-nightmares", game: "destiny2", title: "Raíces de las Pesadillas", titleEn: "Root of Nightmares",
    releaseSlug: "lightfall", label: "ECLIPSE",
    summary: "Aborda la nave pirámide del Testigo y despierta a Nezarec, heraldo de la última forma.",
    rewards: ["Rufus's Fury", "Conditional Finality", "Acasia's Dejection", "Briar's Contempt", "Mykel's Reverence", "Armadura de Raíces de las Pesadillas"],
    encounters: [
      { name: "Cataclismo", guide: "Un jugador enlaza nodos de Luz siguiendo las marcas mientras el resto elimina a los atormentadores y protege al portador. Completa la cadena antes de que expire el temporizador." },
      { name: "Escisión", guide: "Divide el equipo entre los lados de Luz y Oscuridad. Activa nodos, transfiere el potenciador mediante los campos y avanza por las plataformas hasta la parte superior." },
      { name: "Macrocosmos", guide: "Lee las posiciones de los planetas y desplaza cada uno al lado que corresponde a su afinidad. Reagrupa los planetas centrales, identifica el color del daño y ataca al jefe." },
      { name: "Nezarec", guide: "Conecta las cadenas de nodos de ambos lados mientras un equipo controla la mirada del jefe. Recoge las semillas para proteger al grupo de su wipe y daña a Nezarec desde la plataforma central." },
    ],
  },
  {
    id: "crotas-end-d2", game: "destiny2", title: "El Fin de Crota", titleEn: "Crota's End",
    releaseSlug: "season-of-the-witch", label: "REGRESO · TEMPORADA DE LAS BRUJAS",
    summary: "Repite el descenso a la Luna en la versión de Destiny 2, con encuentros revisados y la amenaza renovada de Crota.",
    rewards: ["Abyss Defiant", "Oversoul Edict", "Fang of Ir Yût", "Swordbreaker", "Word of Crota", "Song of Ir Yût", "Necrochasm", "Armadura del Fin de Crota"],
    encounters: [
      { name: "El Abismo", guide: "Avanza de lámpara en lámpara antes de que la oscuridad te inmovilice. Comparte la carga de Luz entre el grupo, carga las placas y cruza el puente con el equipo unido." },
      { name: "El Puente", guide: "Carga el puente y derrota a los campeones de cada lado para cruzar las espadas. Coordina las reliquias y los roles de los guardianes que permanecen en cada orilla." },
      { name: "Ir Yût", guide: "Abre las puertas laterales, elimina magos y ogros y reúne la munición pesada. Derriba el escudo de Ir Yût y concentra el daño antes de que termine el canto." },
      { name: "Crota", guide: "Rompe el escudo y aturde a Crota para permitir los golpes de espada. Gestiona las espadas entre jugadores, elimina los ogros y sincroniza las fases hasta el golpe final." },
    ],
  },
  {
    id: "salvations-edge", game: "destiny2", title: "Borde de la Salvación", titleEn: "Salvation's Edge",
    releaseSlug: "the-final-shape", label: "LA FORMA FINAL",
    summary: "Atraviesa el Monolito dentro del Viajero y detén al Testigo en el umbral de su forma final.",
    rewards: ["Imminence", "Non-Denouement", "Critical Anomaly", "Embraced Identity", "Summum Bonum", "Euphony", "Armadura del Borde de la Salvación"],
    encounters: [
      { name: "Substrato", guide: "Activa las placas y recoge las cargas de Resonancia que aparecen en las salas. Deposítalas en los pedestales correspondientes mientras el equipo elimina a los guardianes de la zona." },
      { name: "Herald del Testigo", guide: "Rompe los puntos débiles del jefe para generar Resonancia y lee el patrón de símbolos. Deposita la carga en el pedestal indicado y daña al Herald en las ventanas." },
      { name: "Repository", guide: "Recorre las salas conectando nodos y recogiendo las formas de Resonancia requeridas. Coordina las cargas y el movimiento del grupo para abrir la ruta antes de la purga." },
      { name: "Verity", guide: "Reconoce las formas asignadas a cada jugador, intercambia las figuras entre salas y entrega al jugador atrapado la combinación que necesita. Confirma las siluetas antes de iniciar cada ronda." },
      { name: "El Testigo", guide: "Destruye las manos que anuncian los ataques y recoge las cargas de Resonancia para formar la protección. Reúne al equipo en el punto seguro, rompe los puntos débiles y daña al Testigo durante la ventana." },
    ],
  },
  {
    id: "the-desert-perpetual", game: "destiny2", title: "El Desierto Perpetuo", titleEn: "The Desert Perpetual",
    releaseSlug: "the-edge-of-fate", label: "LOS CONFINES DEL DESTINO",
    summary: "Explora el desierto vex, decide el orden de tres enfrentamientos y derrota a Koregos, el jefe final de la incursión.",
    rewards: ["Antedate", "Finite Maybe", "Opaque Hourglass", "Lance Ephemeral", "Intercalary", "The When and Where", "Whirling Ovation (exótica)", "Armadura Colectiva Psyche"],
    encounters: [
      { name: "Predestinación", guide: "En el centro del área, elige uno de los tres accesos para decidir cuál de los jefes opcionales afrontar primero: Epoptes, Iatros o Agraios. Sigue la línea de esferas hasta la puerta correspondiente y vuelve al núcleo entre encuentros; completa los tres para abrir el final." },
      { name: "Epoptes, Señor de los Cuanta", guide: "Forma tres parejas para las salas laterales y el centro. Derrota a los Magistrados del Tiempo para obtener la Temporabilidad Cíclica; los jugadores potenciados se coordinan entre salas para romper los ojos de las hidras en sincronía. El centro comunica los cristales que deben dispararse; repite la lectura y destruye los ojos del escudo central para iniciar daño. Durante el daño, los jugadores señalados deben interceptar los haces del jefe y disparar a sus ojos para prolongar la ventana." },
      { name: "Iatros, Orientado hacia Dentro", guide: "Elimina minotauros y recoge sus cronones; deposítalos saltando por el aro para llenar el reloj de arena y mantener tiempo para la mecánica. Divide roles entre limpieza, disparos a los conflujos vex y escalada. El jugador con el potenciador indicado coordina los disparos de abajo hacia arriba; cuando caiga el último confluyo, reúne al equipo en la plataforma para dañar a la wyvern." },
      { name: "Agraios, Inherente", guide: "Derrota a las hidras y minotauros; deposita cronones en los cinco portales para activarlos. Tres jugadores recogen los potenciadores Temporales Absoluto, Cíclico y Constante; identifica cuál coincide con el nombre del francotirador superviviente y que ese jugador se alinee bajo su plataforma. Los otros potenciados leen qué portales tienen el borde azul y el equipo carga los portales indicados. Un jugador atraviesa los portales activos para obtener la granada de detención; úsala para bloquear el disparo del francotirador y exponer al jefe. Repite las detenciones entre ventanas de daño." },
      { name: "Koregos, la Línea Temporal", guide: "En la arena inferior asigna los potenciadores Absoluto, Cíclico y Constante. El equipo de cronones compara color y actividad de las minas para recoger las válidas y llenar el reloj; otro equipo destruye las torretas del jefe. Los tres portadores de potenciadores activan juntos el pilar para leer las minas. Al llenar el reloj, sube por las plataformas; en la zona superior, los portadores identifican los cubos compartidos y los activan cuatro veces para abrir daño. Dispara a los ojos del núcleo y asigna a un jugador la recogida y depósito de cronones para prolongar la ventana; evita los láseres y las zonas eléctricas. Repite el ciclo hasta derrotarlo." },
    ],
  },
];
