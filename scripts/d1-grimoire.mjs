import { unzipSync } from "fflate";
import he from "he";
import { getBungieImageUrl } from "./lore-manifest.mjs";

const SQLITE_SIGNATURE = new TextEncoder().encode("SQLite format 3\0");
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

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
