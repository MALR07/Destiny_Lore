const BATCH_SIZE = 200;

export async function upsertLoreRecords(pool, records, sourceGame, sourceUrl) {
  if (!["destiny1", "destiny2"].includes(sourceGame)) {
    throw new Error(`Juego de origen no válido: ${sourceGame}`);
  }
  if (records.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let start = 0; start < records.length; start += BATCH_SIZE) {
      const batch = records.slice(start, start + BATCH_SIZE);
      const values = [];
      const rows = batch.map((record, index) => {
        const offset = index * 10;
        values.push(
          record.bungieId,
          sourceGame,
          sourceUrl,
          record.imageUrl,
          record.imageKind,
          record.titleEn,
          record.titleEs,
          record.subtitleEs,
          record.contentEn,
          record.contentEs,
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
      });
      await client.query(
        `INSERT INTO lore_entries (
           bungie_id, source_game, source_url, image_url, image_kind, title_en, title_es,
           subtitle_es, content_en, content_es
         )
         VALUES ${rows.join(", ")}
         ON CONFLICT (bungie_id) DO UPDATE SET
           source_game = EXCLUDED.source_game,
           source_url = EXCLUDED.source_url,
           image_url = COALESCE(EXCLUDED.image_url, lore_entries.image_url),
           image_kind = COALESCE(EXCLUDED.image_kind, lore_entries.image_kind),
           title_en = EXCLUDED.title_en,
           title_es = CASE
             WHEN EXCLUDED.source_game = 'destiny1' AND NULLIF(EXCLUDED.title_es, '') IS NOT NULL
               THEN EXCLUDED.title_es
             ELSE COALESCE(NULLIF(EXCLUDED.title_es, ''), lore_entries.title_es)
           END,
           subtitle_es = CASE
             WHEN EXCLUDED.source_game = 'destiny1' AND NULLIF(EXCLUDED.subtitle_es, '') IS NOT NULL
               THEN EXCLUDED.subtitle_es
             ELSE COALESCE(NULLIF(EXCLUDED.subtitle_es, ''), lore_entries.subtitle_es)
           END,
           content_en = EXCLUDED.content_en,
           content_es = CASE
             WHEN EXCLUDED.source_game = 'destiny1' AND NULLIF(EXCLUDED.content_es, '') IS NOT NULL
               THEN EXCLUDED.content_es
             ELSE COALESCE(NULLIF(lore_entries.content_es, ''), NULLIF(EXCLUDED.content_es, ''))
           END,
           updated_at = CURRENT_TIMESTAMP`,
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
