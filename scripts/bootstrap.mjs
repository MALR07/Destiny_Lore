import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pool } from "../netlify/functions/lib/db.mjs";

const SYNC_VERSION = "v9";
const D1_SYNC_VERSION = "v11";
const CATALOG_SYNC_VERSION = "v14";
const LORE_GROUPS_SYNC_VERSION = "v21";
const RELEASE_ITEMS_SYNC_VERSION = "v2";
const SYNC_TASKS = [
  { key: `destiny2-${SYNC_VERSION}`, script: "sync-lore.mjs", label: "Destiny 2" },
  { key: `destiny1-${D1_SYNC_VERSION}`, script: "sync-d1-grimoire.mjs", label: "Grimorio de Destiny 1" },
  { key: `catalog-d2-${CATALOG_SYNC_VERSION}`, script: "sync-catalog-d2.mjs", label: "Catálogo de Destiny 2" },
  { key: `catalog-d1-${CATALOG_SYNC_VERSION}`, script: "sync-catalog-d1.mjs", label: "Catálogo de Destiny 1" },
  { key: `lore-groups-${LORE_GROUPS_SYNC_VERSION}`, script: "sync-lore-groups.mjs", label: "Libros, categorías y lanzamientos de Bungie" },
  {
    key: `release-items-${RELEASE_ITEMS_SYNC_VERSION}`,
    script: "sync-release-items.mjs",
    label: "Items asociados a lanzamientos",
    public: true,
  },
];

function runScript(script) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${script} terminó con código ${result.status ?? "desconocido"}.`);
  }
}

async function main() {
  runScript("init-db.mjs");

  const completed = await pool.query("SELECT sync_key FROM app_sync_state");
  const completedKeys = new Set(completed.rows.map((row) => row.sync_key));
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  let d2Ready = completedKeys.has(SYNC_TASKS[0].key);
  let d1Ready = completedKeys.has(SYNC_TASKS[1].key);

  for (const [index, task] of SYNC_TASKS.entries()) {
    if (completedKeys.has(task.key)) {
      console.log(`${task.label}: ya sincronizado; se conserva la base de datos local.`);
      continue;
    }
    if (!apiKey && !task.public) {
      console.warn(`${task.label}: falta BUNGIE_API_KEY; se omitió la sincronización automática.`);
      continue;
    }
    if (index === 1 && !d2Ready) {
      console.warn("Grimorio de Destiny 1: se pospone hasta que Destiny 2 se sincronice correctamente.");
      continue;
    }
    if (index === 3 && !d1Ready) {
      console.warn("Catálogo de Destiny 1: se pospone hasta que Destiny 1 se sincronice correctamente.");
      continue;
    }
    if (index === 4 && !d2Ready) {
      console.warn("Libros y categorías: se pospone hasta que Destiny 2 se sincronice correctamente.");
      continue;
    }
    if (index === 5 && (!d1Ready || !d2Ready)) {
      console.warn("Items de lanzamientos: se posponen hasta sincronizar ambos catálogos.");
      continue;
    }

    try {
      console.log(`Sincronización inicial automática de ${task.label}…`);
      runScript(task.script);
      await pool.query(
        "INSERT INTO app_sync_state (sync_key) VALUES ($1) ON CONFLICT (sync_key) DO NOTHING",
        [task.key],
      );
      if (index === 0) d2Ready = true;
      if (index === 1) d1Ready = true;
    } catch (error) {
      console.error(`No se pudo completar la sincronización inicial de ${task.label}:`, error);
      console.error("La web arrancará igualmente; se reintentará la próxima vez que inicies Docker.");
      if (index === 0) d2Ready = false;
      if (index === 1) d1Ready = false;
    }
  }
}

try {
  await main();
} catch (error) {
  console.error("No se pudo preparar la base de datos para el inicio:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
