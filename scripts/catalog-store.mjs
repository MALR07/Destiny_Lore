const BATCH_SIZE = 250;

export async function upsertCatalogRecords(pool, records) {
  if (records.length === 0) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let start = 0; start < records.length; start += BATCH_SIZE) {
      const batch = records.slice(start, start + BATCH_SIZE);
      const values = [];
      const rows = batch.map((record, index) => {
        const offset = index * 18;
        values.push(
          record.sourceGame,
          record.bungieId,
          record.category,
          record.titleEn,
          record.titleEs,
          record.summaryEs,
          record.descriptionEn,
          record.descriptionEs,
          record.flavorTextEn,
          record.flavorTextEs,
          record.imageUrl,
          record.imageKind,
          record.rarity,
          record.classType,
          record.itemType,
          record.iconUrl,
          record.sourceUrl,
          new Date(),
        );
        return `(${Array.from({ length: 18 }, (_, parameter) => `$${offset + parameter + 1}`).join(", ")})`;
      });
      await client.query(
        `INSERT INTO game_catalog_entries (
           source_game, bungie_id, category, title_en, title_es,
           summary_es, description_en, description_es, flavor_text_en, flavor_text_es,
           image_url, image_kind, rarity, class_type, item_type, icon_url,
           source_url, updated_at
         ) VALUES ${rows.join(", ")}
         ON CONFLICT (source_game, bungie_id) DO UPDATE SET
           category = EXCLUDED.category,
           title_en = EXCLUDED.title_en,
           title_es = COALESCE(NULLIF(EXCLUDED.title_es, ''), game_catalog_entries.title_es),
           summary_es = EXCLUDED.summary_es,
           description_en = COALESCE(NULLIF(EXCLUDED.description_en, ''), game_catalog_entries.description_en),
           description_es = COALESCE(NULLIF(EXCLUDED.description_es, ''), game_catalog_entries.description_es),
           flavor_text_en = COALESCE(NULLIF(EXCLUDED.flavor_text_en, ''), game_catalog_entries.flavor_text_en),
           flavor_text_es = COALESCE(NULLIF(EXCLUDED.flavor_text_es, ''), game_catalog_entries.flavor_text_es),
           image_url = COALESCE(EXCLUDED.image_url, game_catalog_entries.image_url),
           image_kind = COALESCE(EXCLUDED.image_kind, game_catalog_entries.image_kind),
           rarity = EXCLUDED.rarity,
           class_type = EXCLUDED.class_type,
           item_type = EXCLUDED.item_type,
           icon_url = COALESCE(EXCLUDED.icon_url, game_catalog_entries.icon_url),
           source_url = EXCLUDED.source_url,
           updated_at = EXCLUDED.updated_at`,
        values,
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
