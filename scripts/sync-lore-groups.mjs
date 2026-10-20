import { readFile } from "node:fs/promises";
import { pool } from "../netlify/functions/lib/db.mjs";
import { getD1LocalizedWorldPath, getLocalizedDefinitionPath } from "./lore-manifest.mjs";
import { findSqlitePayload, loadD1Definitions, mapD1GrimoireCategories } from "./d1-grimoire.mjs";
import {
  addPresentationReleaseMetadata,
  findUnmatchedD1EditorialBooks,
  findUnmatchedEditorialBooks,
  mapD1EditorialBooks,
  mapLoreGroups,
  mergeKnownReleases,
} from "./lore-groups.mjs";
import { replaceLoreGroups } from "./lore-group-store.mjs";

const MANIFEST_URL = "https://www.bungie.net/Platform/Destiny2/Manifest/";
const BUNGIE_URL = "https://www.bungie.net";
const TABLES = [
  "DestinyPresentationNodeDefinition",
  "DestinySeasonDefinition",
  "DestinyRecordDefinition",
];

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Bungie respondió HTTP ${response.status}.`);
  const data = await response.json();
  if (data?.ErrorCode && data.ErrorCode !== 1) {
    throw new Error(`Bungie rechazó la solicitud: ${data.ErrorStatus ?? data.Message ?? data.ErrorCode}.`);
  }
  return data;
}

async function loadTable(manifest, locale, table, apiKey) {
  const path = getLocalizedDefinitionPath(manifest, locale, table);
  const url = `${BUNGIE_URL}${path}`;
  const data = await fetchJson(url, { headers: { "X-API-Key": apiKey } });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`La tabla ${table} (${locale}) tiene un formato inesperado.`);
  }
  return { data, url };
}

async function loadD1GrimoireThemes(path, locale) {
  const response = await fetch(`${BUNGIE_URL}${path}`, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Bungie respondió HTTP ${response.status} al descargar el Grimorio de Destiny 1.`);
  const payload = findSqlitePayload(new Uint8Array(await response.arrayBuffer()));
  return loadD1Definitions(payload, locale, "DestinyGrimoireDefinition");
}

async function main() {
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  if (!apiKey) throw new Error("BUNGIE_API_KEY no está configurada.");
  const manifest = await fetchJson(MANIFEST_URL, { headers: { "X-API-Key": apiKey } });
  const tables = await Promise.all(TABLES.map(async (table) => {
    const [en, es] = await Promise.all([
      loadTable(manifest, "en", table, apiKey),
      table === "DestinyRecordDefinition"
        ? Promise.resolve(null)
        : loadTable(manifest, "es", table, apiKey),
    ]);
    return { table, en, es };
  }));
  const presentation = tables.find(({ table }) => table === TABLES[0]);
  const seasons = tables.find(({ table }) => table === TABLES[1]);
  const records = tables.find(({ table }) => table === TABLES[2]);
  if (!presentation || !seasons || !records) {
    throw new Error("No se cargaron las tablas oficiales para agrupar el lore.");
  }

  const knownReleases = JSON.parse(
    await readFile(new URL("../data/release-index.json", import.meta.url), "utf8"),
  ).map((release, index, releases) => ({
    ...release,
    releaseOrder: index + 1,
  }));
  const editorialBookIndex = JSON.parse(
    await readFile(new URL("../data/editorial-book-index.json", import.meta.url), "utf8"),
  );
  const d1EditorialBookIndex = JSON.parse(
    await readFile(new URL("../data/d1-editorial-book-index.json", import.meta.url), "utf8"),
  );
  const d1LoreResult = await pool.query(
    `SELECT bungie_id AS "bungieId", title_en AS "titleEn"
     FROM lore_entries
     WHERE source_game = 'destiny1' AND bungie_id LIKE 'd1:%'`,
  );
  const d1Manifest = await fetchJson("https://www.bungie.net/d1/Platform/Destiny/Manifest/", {
    headers: { "X-API-Key": apiKey },
  });
  if (d1Manifest?.ErrorCode !== 1) {
    throw new Error(`Bungie rechazó el manifiesto de Destiny 1: ${d1Manifest?.ErrorStatus ?? d1Manifest?.Message ?? "error desconocido"}.`);
  }
  const d1SpanishPath = getD1LocalizedWorldPath(d1Manifest, "es");
  const [d1EnglishThemes, d1SpanishThemes] = await Promise.all([
    loadD1GrimoireThemes(getD1LocalizedWorldPath(d1Manifest, "en"), "en"),
    loadD1GrimoireThemes(d1SpanishPath, "es"),
  ]);
  const mappedGroups = [
    ...mapD1GrimoireCategories(
      d1EnglishThemes,
      d1SpanishThemes,
      d1LoreResult.rows,
      `${BUNGIE_URL}${d1SpanishPath}`,
    ),
    ...mapLoreGroups(
    presentation.en.data,
    presentation.es.data,
    seasons.en.data,
    seasons.es.data,
    records.en.data,
    editorialBookIndex,
    knownReleases,
    {
      presentation: presentation.es.url,
      seasons: seasons.es.url,
    },
    ),
    ...mapD1EditorialBooks(d1EditorialBookIndex, knownReleases, d1LoreResult.rows),
  ];
  const unmatchedD1Cards = findUnmatchedD1EditorialBooks(d1EditorialBookIndex, d1LoreResult.rows);
  if (unmatchedD1Cards.length > 0) {
    console.warn(
      `No se encontraron ${unmatchedD1Cards.length} cartas D1 del índice editorial por su título oficial: ` +
      unmatchedD1Cards.map(({ book, title }) => `${book} → ${title}`).join("; "),
    );
  }
  for (const group of mappedGroups.filter(({ sourceGame, groupType }) =>
    sourceGame === "destiny1" && groupType === "book")) {
    if (group.loreHashes.length === 0) {
      throw new Error(`El libro de Destiny 1 "${group.titleEn}" no coincide con ninguna carta oficial.`);
    }
  }
  const unmatchedBooks = findUnmatchedEditorialBooks(mappedGroups, editorialBookIndex);
  if (unmatchedBooks.length > 0) {
    console.warn(
      `No se encontraron ${unmatchedBooks.length} títulos editoriales como nodos con relatos en el manifiesto de Bungie: ${unmatchedBooks.join("; ")}`,
    );
  }
  const groups = addPresentationReleaseMetadata(
    mergeKnownReleases(mappedGroups, knownReleases),
    presentation.en.data,
    presentation.es.data,
    presentation.es.url,
    records.en.data,
  );
  const bookCount = groups.filter((group) => group.groupType === "book").length;
  const categoryCount = groups.filter((group) => group.groupType === "category").length;
  const d1CategoryCount = groups.filter((group) =>
    group.groupType === "category" && group.sourceGame === "destiny1").length;
  const releases = groups.filter((group) => group.groupType === "release");

  await replaceLoreGroups(pool, groups);
  console.log(`Sincronizados ${groups.length.toLocaleString("es-ES")} grupos desde Bungie y el índice local.`);
  console.log(`  Libros: ${bookCount.toLocaleString("es-ES")} clasificados; categorías: ${categoryCount.toLocaleString("es-ES")}.`);
  console.log(`  Grimorio D1: ${d1CategoryCount.toLocaleString("es-ES")} categorías y páginas oficiales.`);
  console.log(`  Lanzamientos: ${knownReleases.length.toLocaleString("es-ES")} títulos locales, ${releases.length.toLocaleString("es-ES")} grupos finales.`);
  console.log(`  Relaciones de lore oficiales: ${releases.filter((group) => group.loreHashes.length > 0).length.toLocaleString("es-ES")}.`);
}

try {
  await main();
} catch (error) {
  console.error("No se pudieron sincronizar los grupos de lore de Bungie:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
