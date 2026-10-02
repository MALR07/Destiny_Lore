import { pool, jsonResponse } from "./lib/db.mjs";

const PAGE_SIZE = 24;
const MAX_PAGE = 10_000;

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Método no permitido." });
  }

  const query = event.queryStringParameters ?? {};
  const search = (query.q ?? "").trim().slice(0, 120);
  const page = Number.parseInt(query.page ?? "1", 10);
  const videosOnly = query.videos === "true";
  const game = query.game ?? "all";
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    return jsonResponse(400, { error: "El número de página no es válido." });
  }
  if (!["all", "destiny1", "destiny2"].includes(game)) {
    return jsonResponse(400, { error: "El filtro de juego no es válido." });
  }

  const values = [];
  const where = ["TRUE"];
  if (query.id) {
    if (!/^\d+$/.test(query.id)) {
      return jsonResponse(400, { error: "El identificador del relato no es válido." });
    }
    values.push(query.id);
    where.push(`e.id = $${values.length}`);
  }
  if (query.group) {
    if (!/^\d+$/.test(query.group)) {
      return jsonResponse(400, { error: "El identificador del grupo no es válido." });
    }
    values.push(query.group);
    where.push(`EXISTS (
      SELECT 1 FROM lore_group_entries ge
      WHERE ge.lore_entry_id = e.id AND ge.group_id = $${values.length}
    )`);
  }
  if (game !== "all") {
    values.push(game);
    where.push(`e.source_game = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    where.push(`(e.title_es ILIKE $${values.length} OR e.title_en ILIKE $${values.length} OR e.content_es ILIKE $${values.length} OR e.content_en ILIKE $${values.length})`);
  }
  if (videosOnly) {
    where.push("EXISTS (SELECT 1 FROM lore_cinematics v WHERE v.lore_entry_id = e.id AND v.is_verified = TRUE AND v.language = 'es')");
  }
  const whereSql = where.join(" AND ");
  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM lore_entries e WHERE ${whereSql}`,
      values,
    );
    const total = countResult.rows[0].total;
    const offset = (page - 1) * PAGE_SIZE;
    const itemValues = [...values, PAGE_SIZE, offset];
    const result = await pool.query(
      `SELECT
         e.id::text AS id,
         e.source_game AS "sourceGame",
         e.source_url AS "sourceUrl",
         e.image_url AS "imageUrl",
         e.image_kind AS "imageKind",
         COALESCE(NULLIF(e.title_es, ''), e.title_en) AS title,
         e.title_en AS "titleEn",
         e.subtitle_es AS subtitle,
         NULLIF(e.content_es, '') AS "contentEs",
         e.content_en AS "contentEn",
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', c.id,
             'title', c.title,
             'youtubeUrl', c.youtube_url,
             'sourceUrl', c.source_url
           ) ORDER BY c.id)
           FROM lore_cinematics c
           WHERE c.lore_entry_id = e.id AND c.is_verified = TRUE AND c.language = 'es'
         ), '[]'::json) AS cinematics
       FROM lore_entries e
       WHERE ${whereSql}
       ORDER BY e.title_es NULLS LAST, e.title_en, e.id
       LIMIT $${itemValues.length - 1} OFFSET $${itemValues.length}`,
      itemValues,
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
      body: JSON.stringify({
        items: result.rows,
        page,
        limit: PAGE_SIZE,
        total,
        hasMore: offset + result.rows.length < total,
      }),
    };
  } catch (error) {
    console.error("No se pudo consultar el archivo de lore:", error);
    return jsonResponse(500, { error: "No se pudo consultar el archivo de lore." });
  }
}
