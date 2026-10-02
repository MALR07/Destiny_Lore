export function getLocalizedLorePath(manifest, locale) {
  if (manifest?.ErrorCode !== 1) {
    throw new Error(`Bungie rechazó el manifiesto: ${manifest?.Message ?? "error desconocido"}`);
  }
  const path = manifest.Response?.jsonWorldComponentContentPaths?.[locale]?.DestinyLoreDefinition;
  if (typeof path !== "string" || !path.startsWith("/common/")) {
    throw new Error(`El manifiesto no ofrece DestinyLoreDefinition para el idioma "${locale}".`);
  }
  return path;
}

export function getLocalizedDefinitionPath(manifest, locale, definitionName) {
  if (manifest?.ErrorCode !== 1) {
    throw new Error(`Bungie rechazó el manifiesto: ${manifest?.Message ?? "error desconocido"}`);
  }
  const path = manifest.Response?.jsonWorldComponentContentPaths?.[locale]?.[definitionName];
  if (typeof path !== "string" || !path.startsWith("/common/")) {
    throw new Error(`El manifiesto no ofrece ${definitionName} para el idioma "${locale}".`);
  }
  return path;
}

export function getD1LocalizedWorldPath(manifest, locale) {
  if (manifest?.ErrorCode !== 1) {
    throw new Error(`Bungie rechazó el manifiesto de Destiny 1: ${manifest?.Message ?? "error desconocido"}`);
  }
  const path = manifest.Response?.mobileWorldContentPaths?.[locale];
  if (typeof path !== "string" || !path.startsWith("/common/destiny_content/")) {
    throw new Error(`El manifiesto de Destiny 1 no ofrece datos del mundo para el idioma "${locale}".`);
  }
  return path;
}

export function getBungieImageUrl(path) {
  if (typeof path !== "string" || !/^\/(?:common|img)\//.test(path)) return null;
  return `https://www.bungie.net${path}`;
}

export function mapLoreDefinitions(english, spanish) {
  return Object.entries(english).flatMap(([hash, definition]) => {
    if (!definition || definition.redacted || definition.blacklisted) return [];
    const englishTitle = he.decode(definition.displayProperties?.name ?? "").trim();
    const contentEn = he.decode(definition.displayProperties?.description ?? "").trim();
    if (!englishTitle || !contentEn) return [];
    const localized = spanish[hash];
    const imageUrl = getBungieImageUrl(
      localized?.displayProperties?.icon || definition.displayProperties?.icon,
    );
    return [{
      bungieId: hash,
      imageUrl,
      imageKind: imageUrl ? "icon" : null,
      titleEn: englishTitle.slice(0, 255),
      titleEs: he.decode(localized?.displayProperties?.name ?? "").trim().slice(0, 255) || null,
      subtitleEs: he.decode(localized?.subtitle ?? "").trim().slice(0, 255) || null,
      contentEn,
      contentEs: he.decode(localized?.displayProperties?.description ?? "").trim() || null,
    }];
  });
}
import he from "he";
