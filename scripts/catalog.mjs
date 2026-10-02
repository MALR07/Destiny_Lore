import he from "he";
import { getBungieImageUrl } from "./lore-manifest.mjs";

function text(value) {
  return typeof value === "string" ? he.decode(value).trim() : "";
}

function firstText(...values) {
  for (const value of values) {
    const candidate = text(value);
    if (candidate) return candidate;
  }
  return null;
}

function descriptionFields(definition) {
  return {
    description: firstText(
      definition.displayProperties?.description,
      definition.itemDescription,
      definition.summary?.itemDescription,
      definition.loreDescription,
      definition.description,
    ),
    flavorText: firstText(
      definition.flavorText,
      definition.displayProperties?.flavorText,
      definition.itemFlavorText,
    ),
  };
}

const D2_RARITIES = new Map([
  [2, "Básico"],
  [3, "Común"],
  [4, "Peculiar"],
  [5, "Leyenda"],
  [6, "Excepcional"],
]);
const D2_RARITY_NAMES = new Map([
  ["basic", "Básico"],
  ["common", "Común"],
  ["uncommon", "Poco común"],
  ["rare", "Peculiar"],
  ["superior", "Leyenda"],
  ["legendary", "Leyenda"],
  ["exotic", "Excepcional"],
]);

function getD2TierRarity(definition) {
  const tierType = definition.inventory?.tierType ?? definition.tierType;
  return D2_RARITIES.get(tierType) ?? null;
}

function normalizeD2Rarity(value) {
  const rarity = text(value);
  return rarity ? D2_RARITY_NAMES.get(rarity.toLocaleLowerCase("en")) ?? rarity : null;
}

function getRarity(definition, game) {
  if (game === "destiny2") {
    return getD2TierRarity(definition)
      ?? normalizeD2Rarity(definition.tierTypeName ?? definition.inventory?.tierTypeName);
  }
  const rarity = firstText(
    definition.tierTypeName,
    definition.inventory?.tierTypeName,
  );
  return rarity?.toLocaleLowerCase("es") === "raro" ? "Peculiar" : rarity;
}

const ITEM_CLASS_LABELS = new Map([
  [0, "Titán"],
  [1, "Cazador"],
  [2, "Hechicero"],
  [3, "todas las clases"],
]);

function buildEquipmentSummary(category, definition, game, rarityValue) {
  const categoryLabel = {
    weapons: "Arma",
    armor: "Armadura",
    objects: "Objeto de inventario",
  }[category];
  const itemType = text(
    definition.itemTypeName
      ?? definition.itemTypeDisplayName
      ?? definition.itemTypeAndTierDisplayName,
  );
  const rarity = rarityValue ?? getRarity(definition, game);
  const classType = definition.classType ?? definition.classTypeHash;
  const classLabel = ITEM_CLASS_LABELS.get(classType);
  const parts = [categoryLabel];
  if (itemType && !itemType.toLocaleLowerCase("es").startsWith(categoryLabel.toLocaleLowerCase("es"))) {
    parts.push(itemType);
  }
  if (rarity) parts.push(rarity);
  if (classLabel && category === "armor") parts.push(`para ${classLabel}`);
  return `${parts.join(" · ")} · Registro del equipo de ${game === "destiny1" ? "Destiny 1" : "Destiny 2"}.`;
}

function buildReferenceSummary(category, game) {
  const labels = {
    characters: "Personaje o vendedor",
    places: "Lugar",
    species: "Pueblo o clase",
    factions: "Facción",
    objects: "Objeto",
  };
  return `${labels[category] ?? "Referencia"} del universo de ${game === "destiny1" ? "Destiny 1" : "Destiny 2"}, según el manifiesto oficial.`;
}

function catalogRecord(game, hash, category, english, spanish, sourceUrl, spanishTextDefinition = spanish) {
  const nameEn = text(
    english.displayProperties?.name
      ?? english.itemName
      ?? english.raceName
      ?? english.className
      ?? english.factionName
      ?? english.destinationName
      ?? english.placeName
      ?? english.locationName
      ?? english.vendorName
      ?? english.summary?.vendorName,
  );
  if (!nameEn || english.redacted || english.blacklisted) return null;

  const imageCandidates = [
    [spanish.screenshot, "artwork"],
    [english.screenshot, "artwork"],
    [spanish.highResIcon, "artwork"],
    [english.highResIcon, "artwork"],
    [spanish.highResolution?.image?.sheetPath, "artwork"],
    [english.highResolution?.image?.sheetPath, "artwork"],
    [spanish.displayProperties?.icon, "icon"],
    [english.displayProperties?.icon, "icon"],
    [english.normalResolution?.image?.sheetPath, "icon"],
    [english.icon, "icon"],
    [english.iconPath, "icon"],
    [english.factionIcon, "icon"],
    [english.summary?.vendorIcon, "icon"],
  ];
  const [imagePath, imageKind] = imageCandidates.find(([path]) => getBungieImageUrl(path)) ?? [null, null];
  const localizedDefinition = Object.keys(spanish).length > 0 ? spanish : english;
  const classType = localizedDefinition.classType ?? localizedDefinition.classTypeHash
    ?? english.classType ?? english.classTypeHash;
  const rarity = game === "destiny2"
    ? getD2TierRarity(english)
      ?? getD2TierRarity(localizedDefinition)
      ?? normalizeD2Rarity(localizedDefinition.tierTypeName ?? localizedDefinition.inventory?.tierTypeName)
      ?? normalizeD2Rarity(english.tierTypeName ?? english.inventory?.tierTypeName)
    : getRarity(localizedDefinition, game) ?? getRarity(english, game);
  const iconUrl = getBungieImageUrl(
    spanish.displayProperties?.icon
      ?? english.displayProperties?.icon
      ?? spanish.icon
      ?? english.icon,
  );
  const descriptionEn = descriptionFields(english);
  const descriptionEs = descriptionFields(spanishTextDefinition);
  const summaryEs = ["weapons", "armor", "objects"].includes(category)
    ? buildEquipmentSummary(category, localizedDefinition, game, rarity)
    : buildReferenceSummary(category, game);

  return {
    sourceGame: game,
    bungieId: `${game === "destiny1" ? "d1" : "d2"}:${hash}`,
    category,
    titleEn: nameEn.slice(0, 255),
    titleEs: text(
      spanish.displayProperties?.name
        ?? spanish.itemName
        ?? spanish.raceName
        ?? spanish.className
        ?? spanish.factionName
        ?? spanish.destinationName
        ?? spanish.placeName
        ?? spanish.locationName
        ?? spanish.vendorName
        ?? spanish.summary?.vendorName,
    ).slice(0, 255) || null,
    summaryEs,
    descriptionEn: descriptionEn.description,
    descriptionEs: descriptionEs.description,
    flavorTextEn: descriptionEn.flavorText,
    flavorTextEs: descriptionEs.flavorText,
    imageUrl: getBungieImageUrl(imagePath),
    imageKind: imagePath ? imageKind : null,
    rarity: rarity?.slice(0, 80) ?? null,
    classType: Number.isInteger(classType) && classType >= 0 && classType <= 3 ? classType : null,
    itemType: text(
      localizedDefinition.itemTypeName
        ?? localizedDefinition.itemTypeDisplayName
        ?? localizedDefinition.itemTypeAndTierDisplayName,
    ).slice(0, 120) || text(
      english.itemTypeName
        ?? english.itemTypeDisplayName
        ?? english.itemTypeAndTierDisplayName,
    ).slice(0, 120) || null,
    iconUrl,
    sourceUrl,
  };
}

export function mapInventoryCatalog(english, spanish, game, sourceUrl) {
  const records = Object.entries(english).flatMap(([hash, definition]) => {
    if (!definition || definition.redacted || definition.blacklisted) return [];
    let category;
    if (definition.itemType === 3) category = "weapons";
    else if (definition.itemType === 2) category = "armor";
    else category = "objects";

    const mapped = catalogRecord(game, `item:${hash}`, category, definition, spanish[hash] ?? {}, sourceUrl);
    return mapped ? [mapped] : [];
  });
  const uniqueRecords = new Map();
  for (const record of records) {
    const key = [
      record.sourceGame,
      record.category,
      record.titleEn,
      record.titleEs ?? "",
      record.imageUrl ?? "",
      record.iconUrl ?? "",
      record.rarity ?? "",
      record.classType ?? "",
      record.itemType ?? "",
      record.descriptionEn ?? "",
      record.descriptionEs ?? "",
      record.flavorTextEn ?? "",
      record.flavorTextEs ?? "",
    ].join("\u0000");
    if (!uniqueRecords.has(key)) uniqueRecords.set(key, record);
  }
  return [...uniqueRecords.values()];
}

export function mapNamedCatalog(english, spanish, game, category, sourceUrl, namespace = category) {
  return Object.entries(english).flatMap(([hash, definition]) => {
    if (!definition || definition.redacted || definition.blacklisted) return [];
    const mapped = catalogRecord(game, `${namespace}:${hash}`, category, definition, spanish[hash] ?? {}, sourceUrl);
    return mapped ? [mapped] : [];
  });
}

export function mapD1InventoryCatalog(englishDefinitions, spanishDefinitions, sourceUrl) {
  return Object.entries(englishDefinitions).flatMap(([hash, english]) => {
    if (!english || english.redacted || english.blacklisted) return [];
    const category = english.itemType === 3
      ? "weapons"
      : english.itemType === 2
        ? "armor"
        : "objects";
    const mapped = catalogRecord(
      "destiny1",
      `item:${english.itemHash ?? hash}`,
      category,
      english,
      {
        ...english,
        ...(spanishDefinitions[hash] ?? {}),
        classType: english.classType,
      },
      sourceUrl,
      spanishDefinitions[hash] ?? {},
    );
    return mapped ? [mapped] : [];
  });
}

export function mapD1NamedCatalog(englishDefinitions, spanishDefinitions, category, sourceUrl, namespace = category) {
  return Object.entries(englishDefinitions).flatMap(([hash, english]) => {
    if (!english || english.redacted || english.blacklisted) return [];
    const mapped = catalogRecord(
      "destiny1",
      `${namespace}:${english.hash ?? hash}`,
      category,
      english,
      spanishDefinitions[hash] ?? {},
      sourceUrl,
    );
    return mapped ? [mapped] : [];
  });
}
