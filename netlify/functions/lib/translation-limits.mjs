import { createHash } from "node:crypto";

const PER_CLIENT_DAILY_LIMIT = 20;
const GLOBAL_DAILY_LIMIT = 100;

export async function reserveTranslation(pool, clientAddress) {
  const addressHash = createHash("sha256").update(clientAddress).digest("hex");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM lore_translation_limits WHERE request_date < CURRENT_DATE - 7",
    );
    for (const [key, maximum] of [
      [`client:${addressHash}`, PER_CLIENT_DAILY_LIMIT],
      ["global", GLOBAL_DAILY_LIMIT],
    ]) {
      const result = await client.query(
        `INSERT INTO lore_translation_limits (limit_key, request_date, request_count)
         VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT (limit_key, request_date) DO UPDATE
         SET request_count = lore_translation_limits.request_count + 1
         WHERE lore_translation_limits.request_count < $2
         RETURNING request_count`,
        [key, maximum],
      );
      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }
    }
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
