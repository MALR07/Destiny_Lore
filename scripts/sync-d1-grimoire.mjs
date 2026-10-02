import initSqlJs from "sql.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { pool } from "../netlify/functions/lib/db.mjs";
import { getD1LocalizedWorldPath } from "./lore-manifest.mjs";
import { findSqlitePayload, mapD1GrimoireDefinitions, removeDuplicateLore } from "./d1-grimoire.mjs";
import { upsertLoreRecords } from "./lore-store.mjs";

const API_URL = "https://www.bungie.net/d1/Platform/Destiny/Manifest/";
const BUNGIE_CONTENT_URL = "https://www.bungie.net";

async function fetchResponse(url, options) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`Bungie respondió HTTP ${response.status} al descargar sus datos.`);
  }
  return response;
}

async function loadDefinitions(databaseBytes, locale) {
  const wasmPath = resolve(dirname(fileURLToPath(import.meta.url)), "../node_modules/sql.js/dist/sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const database = new SQL.Database(databaseBytes);
  try {
    const columns = database.exec("PRAGMA table_info(DestinyGrimoireCardDefinition)")[0]?.values ?? [];
    const names = new Set(columns.map((column) => column[1]));
    const idColumn = names.has("id") ? "id" : names.has("cardId") ? "cardId" : null;
    if (!idColumn || !names.has("json")) {
      throw new Error(`La base de datos ${locale} no tiene el esquema esperado del Grimorio.`);
    }

    const result = database.exec(
      `SELECT "${idColumn}", json FROM DestinyGrimoireCardDefinition ORDER BY "${idColumn}"`,
    )[0];
    if (!result) throw new Error(`No se encontraron definiciones del Grimorio en ${locale}.`);
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

async function fetchDefinitions(path, locale) {
  const response = await fetchResponse(`${BUNGIE_CONTENT_URL}${path}`);
  const archive = new Uint8Array(await response.arrayBuffer());
  const sqliteBytes = findSqlitePayload(archive);
  return loadDefinitions(sqliteBytes, locale);
}

async function main() {
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("BUNGIE_API_KEY no está configurada. Añádela a .env y recrea el contenedor app.");
  }

  const manifestResponse = await fetchResponse(API_URL, {
    headers: { "X-API-Key": apiKey },
  });
  const manifest = await manifestResponse.json();
  const englishPath = getD1LocalizedWorldPath(manifest, "en");
  const spanishPath = getD1LocalizedWorldPath(manifest, "es");
  const [english, spanish] = await Promise.all([
    fetchDefinitions(englishPath, "en"),
    fetchDefinitions(spanishPath, "es"),
  ]);
  const allRecords = mapD1GrimoireDefinitions(english, spanish);
  if (allRecords.length === 0) throw new Error("El manifiesto no devolvió cartas válidas del Grimorio.");
  const existingD2 = await pool.query(
    `SELECT title_en AS "titleEn", title_es AS "titleEs", content_en AS "contentEn", content_es AS "contentEs"
     FROM lore_entries WHERE source_game = 'destiny2'`,
  );
  const records = removeDuplicateLore(allRecords, existingD2.rows);
  const retainedIds = new Set(records.map((record) => record.bungieId));
  const duplicateIds = allRecords
    .filter((record) => !retainedIds.has(record.bungieId))
    .map((record) => record.bungieId);

  if (duplicateIds.length > 0) {
    await pool.query(
      "DELETE FROM lore_entries WHERE source_game = 'destiny1' AND bungie_id = ANY($1::text[])",
      [duplicateIds],
    );
  }

  if (records.length > 0) {
    await upsertLoreRecords(
      pool,
      records,
      "destiny1",
      `${BUNGIE_CONTENT_URL}${spanishPath}`,
    );
  }
  const translated = records.filter((record) => record.contentEs).length;
  console.log(
    `Revisadas ${allRecords.length.toLocaleString("es-ES")} cartas del Grimorio de Destiny 1; ` +
    `${records.length.toLocaleString("es-ES")} nuevas, ` +
    `${(allRecords.length - records.length).toLocaleString("es-ES")} duplicadas con Destiny 2 o entre cartas.`,
  );
  console.log(`Entradas D1 con imagen oficial: ${records.filter((record) => record.imageUrl).length.toLocaleString("es-ES")}.`);
  console.log(`Cartas con texto oficial en español: ${translated.toLocaleString("es-ES")}.`);
}

try {
  await main();
} catch (error) {
  console.error("No se pudo sincronizar el Grimorio de Destiny 1:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
