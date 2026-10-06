export interface RaidArtwork {
  src: string;
  sourceUrl: string;
  credit: string;
}

const DESTINY_1_RAID_ARTWORK: Readonly<Record<string, RaidArtwork>> = {
  "vault-of-glass-d1": {
    src: "/media/site-art/raids/destiny1/vault-of-glass-d1.jpg",
    sourceUrl: "https://destiny.fandom.com/wiki/File:Vault.jpg",
    credit: "CAPTURA DE DESTINY · BUNGIE (DESTINYPEDIA)",
  },
  "crotas-end-d1": {
    src: "/media/site-art/raids/destiny1/crotas-end-d1.jpg",
    sourceUrl: "https://destiny.fandom.com/wiki/File:Crota%27s_End.jpg",
    credit: "CAPTURA DE DESTINY · BUNGIE (DESTINYPEDIA)",
  },
  "kings-fall-d1": {
    src: "/media/site-art/raids/destiny1/kings-fall-d1.jpg",
    sourceUrl: "https://destiny.fandom.com/wiki/File:KingsFallHeader.jpg",
    credit: "CAPTURA DE DESTINY · BUNGIE (DESTINYPEDIA)",
  },
  "wrath-of-the-machine": {
    src: "/media/site-art/raids/destiny1/wrath-of-the-machine.jpg",
    sourceUrl: "https://destiny.fandom.com/wiki/File:WrathoftheMachineHeader.jpg",
    credit: "CAPTURA DE DESTINY · BUNGIE (DESTINYPEDIA)",
  },
};

const DESTINY_2_RAID_ARTWORK: Readonly<Record<string, RaidArtwork>> = {
  leviathan: {
    src: "/media/site-art/raids/destiny2/leviathan-d2.webp",
    sourceUrl: "https://destiny.fandom.com/wiki/File:D2-Leviathan-concept.jpg",
    credit: "ARTE CONCEPTUAL DEL LEVIATÁN · BUNGIE (DESTINYPEDIA)",
  },
  "eater-of-worlds": {
    src: "/media/site-art/raids/destiny2/eater-of-worlds-d2.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=QAcC2TpcGA0",
    credit: "FOTOGRAMA DEL TRÁILER CURSE OF OSIRIS · BUNGIE",
  },
  "spire-of-stars": {
    src: "/media/site-art/raids/destiny2/spire-of-stars-d2.webp",
    sourceUrl: "https://destiny.fandom.com/wiki/File:Val_Ca%27uor.png",
    credit: "ARTE DE VAL CA'UOR · BUNGIE (DESTINYPEDIA)",
  },
  "last-wish": {
    src: "/media/site-art/raids/destiny2/last-wish-d2.webp",
    sourceUrl: "https://destiny.fandom.com/wiki/File:D2-LastWish.PNG",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (DESTINYPEDIA)",
  },
  "scourge-of-the-past": {
    src: "/media/site-art/raids/destiny2/scourge-of-the-past-d2.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=YNRnXcwAt94",
    credit: "FOTOGRAMA DEL TRÁILER OFICIAL · BUNGIE",
  },
  "crown-of-sorrow": {
    src: "/media/site-art/raids/destiny2/crown-of-sorrow-d2.webp",
    sourceUrl: "https://destiny.fandom.com/wiki/File:Crown_of_Sorrow.jpg",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (DESTINYPEDIA)",
  },
  "garden-of-salvation": {
    src: "/media/site-art/raids/destiny2/garden-of-salvation-d2.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=LxIOfW3UTKI",
    credit: "FOTOGRAMA DEL TRÁILER OFICIAL · BUNGIE",
  },
  "deep-stone-crypt": {
    src: "/media/site-art/raids/destiny2/deep-stone-crypt-d2.webp",
    sourceUrl: "https://destiny.fandom.com/wiki/File:Deep_Stone_Crypt_Raid.jpg",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (DESTINYPEDIA)",
  },
  "vault-of-glass-d2": {
    src: "/media/site-art/raids/destiny2/vault-of-glass-d2.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=L_n8u_Ltq9U",
    credit: "FOTOGRAMA DEL TRÁILER OFICIAL · BUNGIE",
  },
  "vow-of-the-disciple": {
    src: "/media/site-art/raids/destiny2/vow-of-the-disciple-d2.jpg",
    sourceUrl: "https://press.bungie.com/Vow-of-the-Disciple---Press-kit",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (PRESS ROOM)",
  },
  "kings-fall-d2": {
    src: "/media/site-art/raids/destiny2/kings-fall-d2.jpg",
    sourceUrl: "https://press.bungie.com/Raid-Press-Kit",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (PRESS ROOM)",
  },
  "root-of-nightmares": {
    src: "/media/site-art/raids/destiny2/root-of-nightmares-d2.jpg",
    sourceUrl: "https://press.bungie.com/Root-of-Nightmares-Raid-95238",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (PRESS ROOM)",
  },
  "crotas-end-d2": {
    src: "/media/site-art/raids/destiny2/crotas-end-d2.jpg",
    sourceUrl: "https://press.bungie.com/Crotas-End-27916",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (PRESS ROOM)",
  },
  "salvations-edge": {
    src: "/media/site-art/raids/destiny2/salvations-edge-d2.jpg",
    sourceUrl: "https://press.bungie.com/Salvations-Edge-Raid",
    credit: "CAPTURA DE DESTINY 2 · BUNGIE (PRESS ROOM)",
  },
  "the-desert-perpetual": {
    src: "/media/site-art/raids/destiny2/the-desert-perpetual-d2.jpg",
    sourceUrl: "https://press.bungie.com/The-Desert-Perpetual-Epic-Raid-Assets",
    credit: "ARTE PROMOCIONAL DE DESTINY 2 · BUNGIE (PRESS ROOM)",
  },
};

export function getRaidArtwork(raidId: string): RaidArtwork | null {
  return DESTINY_1_RAID_ARTWORK[raidId] ?? DESTINY_2_RAID_ARTWORK[raidId] ?? null;
}
