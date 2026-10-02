import { readFile } from "node:fs/promises";
import { pool } from "../netlify/functions/lib/db.mjs";

const BATCH_SIZE = 250;

async function main() {
  const [releaseIndex, itemIndex] = await Promise.all([
    readFile(new URL("../data/release-index.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/release-item-index.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const releases = new Map(releaseIndex.map((release) => [release.slug, release]));
  const records = [];
  const seen = new Set();

  for (const [releaseSlug, items] of Object.entries(itemIndex)) {
    const release = releases.get(releaseSlug);
    if (!release) throw new Error(`El índice de items hace referencia al lanzamiento desconocido "${releaseSlug}".`);
    if (!Array.isArray(items)) throw new Error(`La lista de items de "${releaseSlug}" debe ser un array.`);
    for (const item of items) {
      if (
        !item
        || item.sourceGame !== release.sourceGame
        || typeof item.titleEn !== "string"
        || !item.titleEn.trim()
        || (item.iconUrl !== null
          && (typeof item.iconUrl !== "string" || !/^https:\/\/www\.bungie\.net\/(?:common|img)\//.test(item.iconUrl)))
        || !["weapons", "armor", "objects"].includes(item.category)
        || (item.classType !== null && item.classType !== undefined
          && (!Number.isInteger(item.classType) || item.classType < 0 || item.classType > 3))
        || (item.rarity !== null && item.rarity !== undefined && typeof item.rarity !== "string")
        || (item.itemType !== null && item.itemType !== undefined && typeof item.itemType !== "string")
        || typeof item.ishtarItemSlug !== "string"
        || !/^[a-z0-9-]+$/.test(item.ishtarItemSlug)
      ) {
        throw new Error(`Hay una asignación de item no válida en "${releaseSlug}".`);
      }
      const key = [
        releaseSlug,
        item.sourceGame,
        item.category,
        item.titleEn,
        item.iconUrl,
        item.classType ?? "",
        item.rarity ?? "",
        item.itemType ?? "",
      ].join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({ releaseSlug, ...item });
    }
  }
  if (records.length === 0) {
    throw new Error("El índice local no contiene items; genera primero data/release-item-index.json.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM release_catalog_entries");
    for (let start = 0; start < records.length; start += BATCH_SIZE) {
      const batch = records.slice(start, start + BATCH_SIZE);
      const values = [];
      const rows = batch.map((record, index) => {
        const offset = index * 9;
        values.push(
          record.releaseSlug,
          record.sourceGame,
          record.titleEn,
          record.iconUrl,
          record.category,
          record.classType ?? null,
          record.rarity ?? null,
          record.itemType ?? null,
          record.ishtarItemSlug,
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
      });
      const result = await client.query(
        `INSERT INTO release_catalog_entries (release_slug, catalog_entry_id, ishtar_item_slug)
         SELECT mapped.release_slug, MIN(item.id), mapped.ishtar_item_slug
         FROM (VALUES ${rows.join(", ")})
           AS mapped(
             release_slug, source_game, title_en, icon_url, category,
             class_type, rarity, item_type, ishtar_item_slug
           )
         JOIN game_catalog_entries item
           ON item.source_game = mapped.source_game
           AND item.title_en = mapped.title_en
           AND item.category = mapped.category
           AND item.class_type IS NOT DISTINCT FROM mapped.class_type
           AND item.rarity IS NOT DISTINCT FROM mapped.rarity
           AND item.item_type IS NOT DISTINCT FROM mapped.item_type
           AND (
             item.icon_url = mapped.icon_url
             OR item.image_url = mapped.icon_url
             OR (SELECT COUNT(*)
                 FROM game_catalog_entries title_match
                 WHERE title_match.source_game = mapped.source_game
                   AND title_match.title_en = mapped.title_en
                   AND title_match.category = mapped.category
                   AND title_match.class_type IS NOT DISTINCT FROM mapped.class_type
                   AND title_match.rarity IS NOT DISTINCT FROM mapped.rarity
                   AND title_match.item_type IS NOT DISTINCT FROM mapped.item_type) = 1
           )
         GROUP BY mapped.release_slug, mapped.source_game, mapped.title_en,
                  mapped.icon_url, mapped.category, mapped.class_type, mapped.rarity,
                  mapped.item_type, mapped.ishtar_item_slug
         ON CONFLICT (release_slug, catalog_entry_id)
         DO UPDATE SET ishtar_item_slug = EXCLUDED.ishtar_item_slug`,
        values,
      );
      if (result.rowCount < batch.length) {
        throw new Error(
          `Solo se resolvieron ${result.rowCount} de ${batch.length} items oficiales ` +
          `en el lote ${Math.floor(start / BATCH_SIZE) + 1}. Comprueba la sincronización de catálogos.`,
        );
      }
    }
    await client.query("COMMIT");
    console.log(`Asociados ${records.length.toLocaleString("es-ES")} items oficiales a lanzamientos.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await main();
} catch (error) {
  console.error("No se pudieron asociar los items de los lanzamientos:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
