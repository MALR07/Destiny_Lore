import { pool } from "../netlify/functions/lib/db.mjs";
import { getLocalizedDefinitionPath } from "./lore-manifest.mjs";
import { mapInventoryCatalog, mapNamedCatalog } from "./catalog.mjs";
import { upsertCatalogRecords } from "./catalog-store.mjs";

const MANIFEST_URL = "https://www.bungie.net/Platform/Destiny2/Manifest/";
const BUNGIE_URL = "https://www.bungie.net";
const OPTIONAL_TABLES = [
  ["DestinyVendorDefinition", "characters"],
  ["DestinyDestinationDefinition", "places"],
  ["DestinyRaceDefinition", "species"],
  ["DestinyClassDefinition", "species"],
  ["DestinyEnemyRaceDefinition", "species"],
  ["DestinyFactionDefinition", "factions"],
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
  const data = await fetchJson(`${BUNGIE_URL}${path}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`La tabla ${table} (${locale}) tiene un formato inesperado.`);
  }
  return { data, sourceUrl: `${BUNGIE_URL}${path}` };
}

async function main() {
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  if (!apiKey) throw new Error("BUNGIE_API_KEY no está configurada.");
  const manifest = await fetchJson(MANIFEST_URL, { headers: { "X-API-Key": apiKey } });
  const [itemsEn, itemsEs] = await Promise.all([
    loadTable(manifest, "en", "DestinyInventoryItemDefinition", apiKey),
    loadTable(manifest, "es", "DestinyInventoryItemDefinition", apiKey),
  ]);
  const records = mapInventoryCatalog(itemsEn.data, itemsEs.data, "destiny2", itemsEs.sourceUrl);

  for (const [table, category] of OPTIONAL_TABLES) {
    let enPath;
    try {
      enPath = getLocalizedDefinitionPath(manifest, "en", table);
    } catch {
      continue;
    }
    const esPath = getLocalizedDefinitionPath(manifest, "es", table);
    const [english, spanish] = await Promise.all([
      fetchJson(`${BUNGIE_URL}${enPath}`, { headers: { "X-API-Key": apiKey } }),
      fetchJson(`${BUNGIE_URL}${esPath}`, { headers: { "X-API-Key": apiKey } }),
    ]);
    const sourceUrl = `${BUNGIE_URL}${esPath}`;
    records.push(...mapNamedCatalog(english, spanish, "destiny2", category, sourceUrl, table));
  }

  await upsertCatalogRecords(pool, records);
  const counts = Object.groupBy(records, (record) => record.category);
  console.log(`Sincronizados ${records.length.toLocaleString("es-ES")} elementos del catálogo D2.`);
  for (const [category, entries] of Object.entries(counts)) {
    console.log(`  ${category}: ${entries.length.toLocaleString("es-ES")}`);
  }
}

try {
  await main();
} catch (error) {
  console.error("No se pudo sincronizar el catálogo de Destiny 2:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
