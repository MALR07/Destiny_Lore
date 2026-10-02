export const guardianTimelineIntro = [
  "Este recorrido sigue el orden de publicación de las campañas y temporadas conocidas.",
  "La cronología interna puede diferir; cada hito enlaza los relatos que Bungie asocia al lanzamiento.",
].join(" ");

export const guardianTimelineNotes: Record<string, string> = {
  destiny: "En la Antigua Rusia, un Espectro encuentra al Guardián y lo devuelve a la vida. Aquí comienza nuestro viaje.",
  "age-of-triumph": "El evento final de Destiny celebra las incursiones, las hazañas y el camino recorrido por los Guardianes.",
  "the-dark-below": "La amenaza de Crota lleva al Guardián a enfrentarse a una nueva fuerza de la Colmena.",
  "house-of-wolves": "Los Insomnes y la Casa de los Lobos abren un nuevo frente en el Arrecife.",
  "the-taken-king": "La Guerra de los Poseídos enfrenta al Guardián con Oryx y su ejército.",
  "the-taken-king-april-update": "La actualización de abril amplía la guerra contra los Poseídos y las actividades del Rey de los Poseídos.",
  "rise-of-iron": "Los Señores de Hierro y la amenaza SIVA marcan una nueva etapa en la Tierra.",
  "destiny-2": "La Guerra Roja pone a prueba a la Ciudad y a los Guardianes, separados de la Luz.",
  "curse-of-osiris": "La búsqueda de Osiris lleva al Guardián hasta Mercurio y a las simulaciones de la Red Vex.",
  warmind: "En Marte, el Guardián se enfrenta a la Colmena y descubre los secretos de Rasputín.",
  forsaken: "La muerte de Cayde-6 conduce al Guardián de vuelta al Arrecife y a la Ciudad Ensoñada.",
  shadowkeep: "El regreso a la Luna revela una amenaza ligada a las naves piramidales.",
  "season-of-the-forge": "La Armería Negra abre nuevas forjas y encarga al Guardián recuperar sus poderosas armas.",
  "season-of-the-drifter": "La pugna entre el Nómada y la Vanguardia pone a prueba la lealtad de los Guardianes.",
  "season-of-opulence": "El emperador Calus convoca a los Guardianes al Leviatán para poner a prueba su fuerza.",
  "beyond-light": "En Europa, el Guardián descubre el poder de la estasis y los secretos de la Casa de la Salvación.",
  "season-of-dawn": "El Guardián ayuda a Osiris a rescatar a Saint-14 y a reparar el curso del tiempo.",
  "season-of-the-worthy": "La Vanguardia se alía con Rasputín para detener la amenaza de la nave Almighty.",
  "season-of-arrivals": "Las naves piramidales llegan al sistema y la Oscuridad comienza a comunicarse con el Guardián.",
  "season-of-the-hunt": "El Guardián y el Cuervo persiguen a la prole de Xivu Arath por el sistema.",
  "season-of-the-chosen": "La Vanguardia se enfrenta a Caiatl y busca una tregua sin renunciar a sus condiciones.",
  "season-of-the-splicer": "Mithrax y los Eliksni aliados ayudan a la Ciudad a resistir una noche Vex interminable.",
  "season-of-the-lost": "Mara Sov regresa al sistema y emprende una búsqueda ligada a Savathûn.",
  "the-witch-queen": "La investigación de Savathûn y de la Colmena Luciente cambia lo que sabemos sobre la Luz.",
  "season-of-the-haunted": "El Leviatán regresa a la Luna y conecta las pesadillas de sus visitantes con sus antiguos temores.",
  "season-of-plunder": "El Guardián y Mithrax persiguen reliquias de la Oscuridad antes de que caigan en malas manos.",
  "season-of-the-seraph": "La operación Serafín reúne a Ana Bray y Rasputín ante una amenaza inminente.",
  lightfall: "La búsqueda del Testigo lleva la guerra hasta Neomuna y presenta el poder de la atadura.",
  "season-of-the-deep": "El Guardián vuelve a Titán para investigar una señal y ayudar a Sloane.",
  "season-of-the-witch": "Eris Morn recurre a la magia de la Colmena para enfrentarse a Xivu Arath.",
  "season-of-the-wish": "La Vanguardia busca un acuerdo con Riven para abrir un camino hacia el Testigo.",
  "the-final-shape": "El Guardián persigue al Testigo dentro del Viajero para poner fin a la saga de la Luz y la Oscuridad.",
};

export function describeTimelineRelease(slug: string | null, title: string): string {
  if (!slug) return `Hito de ${title} en el recorrido del Guardián.`;
  return guardianTimelineNotes[slug]
    ?? `Los relatos oficiales asociados a ${title} amplían esta etapa del recorrido del Guardián.`;
}
