const BATCH_SIZE = 90;

export async function replaceLoreGroups(pool, groups) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM lore_groups");

    for (let start = 0; start < groups.length; start += BATCH_SIZE) {
      const batch = groups.slice(start, start + BATCH_SIZE);
      const values = [];
      const rows = batch.map((group, index) => {
        const offset = index * 10;
        values.push(
          group.sourceGame,
          group.groupType,
          group.bungieId,
          group.titleEn,
          group.titleEs,
          group.imageUrl,
          group.sourceUrl,
          group.releaseNumber,
          group.releaseOrder,
          group.releaseSlug,
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
      });
      const inserted = await client.query(
        `INSERT INTO lore_groups (
           source_game, group_type, bungie_id, title_en, title_es,
           image_url, source_url, release_number, release_order, release_slug
         )
         VALUES ${rows.join(", ")}
         RETURNING id, group_type AS "groupType", bungie_id AS "bungieId"`,
        values,
      );

      const insertedIds = new Map(inserted.rows.map((row) => [
        `${row.groupType}:${row.bungieId}`,
        row.id,
      ]));
      const groupIds = [];
      const loreHashes = [];
      const positions = [];
      for (const group of batch) {
        const groupId = insertedIds.get(`${group.groupType}:${group.bungieId}`);
        if (!groupId) throw new Error(`No se pudo guardar el grupo ${group.bungieId}.`);
        group.loreHashes.forEach((loreHash, position) => {
          groupIds.push(groupId);
          loreHashes.push(loreHash);
          positions.push(position);
        });
      }
      if (groupIds.length > 0) {
        await client.query(
          `INSERT INTO lore_group_entries (group_id, lore_entry_id, sort_order)
           SELECT mapping.group_id, e.id, mapping.sort_order
           FROM unnest($1::bigint[], $2::text[], $3::int[]) AS mapping(group_id, lore_hash, sort_order)
           JOIN lore_groups g ON g.id = mapping.group_id
           JOIN lore_entries e ON e.bungie_id = mapping.lore_hash
           ON CONFLICT (group_id, lore_entry_id) DO NOTHING`,
          [groupIds, loreHashes, positions],
        );
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
