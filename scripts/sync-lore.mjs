import { pool } from "../netlify/functions/lib/db.mjs";
import { getLocalizedLorePath, mapLoreDefinitions } from "./lore-manifest.mjs";
import { upsertLoreRecords } from "./lore-store.mjs";

const BUNGIE_API_URL = "https://www.bungie.net/Platform/Destiny2/Manifest/";
const BUNGIE_CONTENT_URL = "https://www.bungie.net";

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Bungie respondió ${response.status} al solicitar el manifiesto.`);
  }
  return response.json();
}

async function getLoreDefinitions(path, locale) {
  const definitions = await fetchJson(`${BUNGIE_CONTENT_URL}${path}`);
  if (!definitions || typeof definitions !== "object" || Array.isArray(definitions)) {
    throw new Error(`La descarga de definiciones para "${locale}" tiene un formato inesperado.`);
  }
  return definitions;
}

async function main() {
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("BUNGIE_API_KEY no está configurada. Añádela a .env y recrea el contenedor app.");
  }
  const manifest = await fetchJson(BUNGIE_API_URL, {
    headers: { "X-API-Key": apiKey },
  });
  const englishPath = getLocalizedLorePath(manifest, "en");
  const spanishPath = getLocalizedLorePath(manifest, "es");
  const [english, spanish] = await Promise.all([
    getLoreDefinitions(englishPath, "en"),
    getLoreDefinitions(spanishPath, "es"),
  ]);
  const records = mapLoreDefinitions(english, spanish);
  const sourceUrl = `${BUNGIE_CONTENT_URL}${spanishPath}`;
  await upsertLoreRecords(pool, records, "destiny2", sourceUrl);
  console.log(`Sincronizados ${records.length.toLocaleString("es-ES")} relatos (inglés y español oficial disponible).`);
}

try {
  await main();
} catch (error) {
  console.error("No se pudo sincronizar el lore:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
