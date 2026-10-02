import initSqlJs from "sql.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { pool } from "../netlify/functions/lib/db.mjs";
import { getD1LocalizedWorldPath } from "./lore-manifest.mjs";
import { findSqlitePayload } from "./d1-grimoire.mjs";
import { mapD1InventoryCatalog, mapD1NamedCatalog } from "./catalog.mjs";
import { upsertCatalogRecords } from "./catalog-store.mjs";

const MANIFEST_URL = "https://www.bungie.net/d1/Platform/Destiny/Manifest/";
const BUNGIE_URL = "https://www.bungie.net";
const TABLES = [
  ["DestinyVendorDefinition", "characters"],
  ["DestinyDestinationDefinition", "places"],
  ["DestinyRaceDefinition", "species"],
  ["DestinyEnemyRaceDefinition", "species"],
  ["DestinyClassDefinition", "species"],
  ["DestinyFactionDefinition", "factions"],
];

async function fetchResponse(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Bungie respondió HTTP ${response.status}.`);
  return response;
}

async function loadDatabase(path) {
  const response = await fetchResponse(`${BUNGIE_URL}${path}`);
  const sqlite = findSqlitePayload(new Uint8Array(await response.arrayBuffer()));
  const wasmPath = resolve(dirname(fileURLToPath(import.meta.url)), "../node_modules/sql.js/dist/sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  return new SQL.Database(sqlite);
}

function readTable(database, table) {
  const tables = database.exec("SELECT name FROM sqlite_master WHERE type = 'table'")[0]?.values ?? [];
  if (!tables.some(([name]) => name === table)) return {};
  const rows = database.exec(`SELECT id, json FROM "${table}" ORDER BY id`)[0];
  if (!rows) return {};
  return Object.fromEntries(rows.values.flatMap(([id, raw]) => {
    if (typeof raw !== "string") return [];
    try {
      return [[String(id), JSON.parse(raw)]];
    } catch {
      throw new Error(`${table} contiene JSON no válido en el registro ${id}.`);
    }
  }));
}

async function main() {
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  if (!apiKey) throw new Error("BUNGIE_API_KEY no está configurada.");
  const response = await fetchResponse(MANIFEST_URL, { headers: { "X-API-Key": apiKey } });
  const manifest = await response.json();
  const englishPath = getD1LocalizedWorldPath(manifest, "en");
  const spanishPath = getD1LocalizedWorldPath(manifest, "es");
  const [englishDatabase, spanishDatabase] = await Promise.all([
    loadDatabase(englishPath),
    loadDatabase(spanishPath),
  ]);
  try {
    const sourceUrl = `${BUNGIE_URL}${spanishPath}`;
    const itemsEn = readTable(englishDatabase, "DestinyInventoryItemDefinition");
    const itemsEs = readTable(spanishDatabase, "DestinyInventoryItemDefinition");
    const records = mapD1InventoryCatalog(itemsEn, itemsEs, sourceUrl);
    for (const [table, category] of TABLES) {
      records.push(...mapD1NamedCatalog(
        readTable(englishDatabase, table),
        readTable(spanishDatabase, table),
        category,
        sourceUrl,
        table,
      ));
    }
    await upsertCatalogRecords(pool, records);
    const counts = Object.groupBy(records, (record) => record.category);
    console.log(`Sincronizados ${records.length.toLocaleString("es-ES")} elementos del catálogo D1.`);
    for (const [category, entries] of Object.entries(counts)) {
      console.log(`  ${category}: ${entries.length.toLocaleString("es-ES")}`);
    }
    console.log(`Armas y armaduras con icono oficial: ${records.filter((record) => ["weapons", "armor"].includes(record.category) && record.imageUrl).length.toLocaleString("es-ES")}.`);
  } finally {
    englishDatabase.close();
    spanishDatabase.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("No se pudo sincronizar el catálogo de Destiny 1:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
