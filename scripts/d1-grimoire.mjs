import { unzipSync } from "fflate";
import he from "he";
import initSqlJs from "sql.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getBungieImageUrl } from "./lore-manifest.mjs";

const SQLITE_SIGNATURE = new TextEncoder().encode("SQLite format 3\0");
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];
const DEFINITION_TABLES = new Set(["DestinyGrimoireCardDefinition", "DestinyGrimoireDefinition"]);

function hasSignature(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function findSqlitePayload(bytes, depth = 0) {
  if (hasSignature(bytes, SQLITE_SIGNATURE)) return bytes;
  if (depth >= 3 || !hasSignature(bytes, ZIP_SIGNATURE)) {
    throw new Error("El archivo del manifiesto no contiene una base SQLite reconocible.");
  }

  const files = unzipSync(bytes);
  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith("/")) continue;
    if (hasSignature(content, SQLITE_SIGNATURE)) return content;
    if (hasSignature(content, ZIP_SIGNATURE)) return findSqlitePayload(content, depth + 1);
  }
  throw new Error("No se encontró la base SQLite dentro del archivo del manifiesto.");
}

export async function loadD1Definitions(databaseBytes, locale, tableName) {
  if (!DEFINITION_TABLES.has(tableName)) {
    throw new Error(`La tabla ${tableName} no está permitida para leer el Grimorio.`);
  }
  const wasmPath = resolve(dirname(fileURLToPath(import.meta.url)), "../node_modules/sql.js/dist/sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const database = new SQL.Database(databaseBytes);
  try {
    const columns = database.exec(`PRAGMA table_info("${tableName}")`)[0]?.values ?? [];
    const names = new Set(columns.map((column) => column[1]));
    const idColumn = names.has("id") ? "id" : names.has("cardId") ? "cardId" : null;
    if (!idColumn || !names.has("json")) {
      throw new Error(`La base de datos ${locale} no tiene el esquema esperado del Grimorio (${tableName}).`);
    }

    const result = database.exec(
      `SELECT "${idColumn}", json FROM "${tableName}" ORDER BY "${idColumn}"`,
    )[0];
    if (!result) throw new Error(`No se encontraron definiciones del Grimorio en ${locale} (${tableName}).`);
    const definitions = {};
    for (const [id, rawJson] of result.values) {
      if (typeof rawJson !== "string") continue;
      try {
        definitions[String(id)] = JSON.parse(rawJson);
      } catch {
        throw new Error(`Una definición del Grimorio ${locale} contiene JSON no válido (ID ${id}).`);
      }
    }
    return definitions;
  } finally {
    database.close();
  }
}

function stringValue(value) {
  return typeof value === "string" ? he.decode(value).trim() : "";
}

function stripMarkup(value) {
  return value
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/giu, "\n\n")
    .replace(/<[^>]*>/gu, "")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function getCardText(definition) {
  return stripMarkup([definition.cardIntro, definition.cardDescription]
    .map(stringValue)
    .filter(Boolean)
    .join("\n\n")
    .replace(
      /(?:^|\n{1,2})<b>\s*(?:Verse|Versículo)\s+5:6\s*[—–-]\s*Aiat,\s*aiat,\s*aiat,\s*aiat,\s*aiat\s*<\/b>\s*/iu,
      "\n\n",
    )
    .replace(/\n{3,}/gu, "\n\n")
  );
}

export function mapD1GrimoireDefinitions(englishDefinitions, spanishDefinitions) {
  return Object.entries(englishDefinitions).flatMap(([rowId, english]) => {
    if (!english || typeof english !== "object") return [];
    const cardId = String(english.cardId ?? rowId).trim();
    const titleEn = stringValue(english.cardName ?? english.displayProperties?.name);
    const contentEn = getCardText(english);
    if (!cardId || !titleEn) return [];

    const spanish = spanishDefinitions[cardId] ?? spanishDefinitions[rowId];
    const titleEs = stringValue(spanish?.cardName ?? spanish?.displayProperties?.name);
    const contentEs = spanish ? getCardText(spanish) : "";
    const attribution = stringValue(spanish?.cardIntroAttribution);
    const highResolutionPath = spanish?.highResolution?.image?.sheetPath
      ?? english.highResolution?.image?.sheetPath;
    const imageUrl = getBungieImageUrl(
      highResolutionPath
        ?? spanish?.normalResolution?.image?.sheetPath
        ?? english.normalResolution?.image?.sheetPath,
    );

    return [{
      bungieId: `d1:${cardId}`,
      imageUrl,
      imageKind: imageUrl ? (highResolutionPath ? "artwork" : "icon") : null,
      titleEn: titleEn.slice(0, 255),
      titleEs: titleEs ? titleEs.slice(0, 255) : null,
      subtitleEs: attribution ? attribution.slice(0, 255) : null,
      contentEn,
      contentEs: contentEs || null,
    }];
  });
}

export function mapD1GrimoireCategories(
  englishDefinitions,
  spanishDefinitions,
  d1LoreEntries,
  sourceUrl,
) {
  const englishThemes = Object.values(englishDefinitions)
    .flatMap((definition) => Array.isArray(definition?.themeCollection) ? definition.themeCollection : []);
  if (englishThemes.length === 0) {
    throw new Error("El manifiesto de Destiny 1 no contiene categorías del Grimorio.");
  }

  const localizedThemes = new Map(
    Object.values(spanishDefinitions)
      .flatMap((definition) => Array.isArray(definition?.themeCollection) ? definition.themeCollection : [])
      .map((theme) => [String(theme.themeId), theme]),
  );
  const loreIds = new Set(d1LoreEntries.map(({ bungieId }) => bungieId));
  const groups = [];

  for (const [themeIndex, theme] of englishThemes.entries()) {
    const themeId = String(theme.themeId ?? "").trim();
    const titleEn = stringValue(theme.themeName);
    if (!themeId || !titleEn) continue;
    const themeGroupId = `d1-theme:${themeId}`;
    const localizedTheme = localizedThemes.get(themeId);
    const pages = Array.isArray(theme.pageCollection) ? theme.pageCollection : [];
    const pageGroups = pages.flatMap((page, pageIndex) => {
      const pageId = String(page.pageId ?? "").trim();
      const pageTitleEn = stringValue(page.pageName);
      if (!pageId || !pageTitleEn) return [];
      const cardIds = Array.isArray(page.cardBriefs)
        ? [...new Set(page.cardBriefs
          .map((brief) => String(brief?.cardId ?? "").trim())
          .filter(Boolean)
          .map((cardId) => `d1:${cardId}`)
          .filter((bungieId) => loreIds.has(bungieId)))]
        : [];
      return [{
        groupType: "category",
        sourceGame: "destiny1",
        bungieId: `d1-page:${themeId}:${pageId}`,
        parentBungieId: themeGroupId,
        sortOrder: pageIndex,
        titleEn: pageTitleEn.slice(0, 255),
        titleEs: stringValue(
          localizedTheme?.pageCollection?.find((localizedPage) => String(localizedPage.pageId) === pageId)?.pageName,
        ).slice(0, 255) || null,
        imageUrl: null,
        sourceUrl,
        releaseNumber: null,
        releaseOrder: null,
        releaseSlug: null,
        loreHashes: cardIds,
      }];
    });

    groups.push({
      groupType: "category",
      sourceGame: "destiny1",
      bungieId: themeGroupId,
      parentBungieId: null,
      sortOrder: themeIndex,
      titleEn: titleEn.slice(0, 255),
      titleEs: stringValue(localizedTheme?.themeName).slice(0, 255) || null,
      imageUrl: null,
      sourceUrl,
      releaseNumber: null,
      releaseOrder: null,
      releaseSlug: null,
      loreHashes: [...new Set(pageGroups.flatMap(({ loreHashes }) => loreHashes))],
    }, ...pageGroups);
  }

  return groups;
}

function normalizeLore(value) {
  return he.decode(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("es")
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getLoreSignatures(record) {
  const signatures = [];
  for (const language of ["En", "Es"]) {
    const title = normalizeLore(language === "En" ? record.titleEn : record.titleEs);
    const content = normalizeLore(language === "En" ? record.contentEn : record.contentEs);
    if (title && content) signatures.push(`${title}\u0000${content}`);
  }
  return signatures;
}

export function removeDuplicateLore(records, existingRecords) {
  const signatures = new Set(existingRecords.flatMap(getLoreSignatures));
  const seen = new Set();
  return records.filter((record) => {
    const recordSignatures = getLoreSignatures(record);
    if (recordSignatures.some((signature) => signatures.has(signature) || seen.has(signature))) {
      return false;
    }
    for (const signature of recordSignatures) seen.add(signature);
    return true;
  });
}
