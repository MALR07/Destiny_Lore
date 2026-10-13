import { pool, jsonResponse } from "./lib/db.mjs";

const PAGE_SIZE = 24;
const MAX_PAGE = 10_000;
const CATEGORIES = ["all", "weapons", "armor", "characters", "places", "species", "factions", "objects"];
const GAMES = ["all", "destiny1", "destiny2"];

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Método no permitido." });
  }

  const query = event.queryStringParameters ?? {};
  const page = Number.parseInt(query.page ?? "1", 10);
  const category = query.category ?? "all";
  const game = query.game ?? "all";
  const search = (query.q ?? "").trim().slice(0, 120);
  const releaseSlug = query.release ?? "";
  const rarity = (query.rarity ?? "").trim().slice(0, 80);
  const classType = query.classType ?? "all";
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    return jsonResponse(400, { error: "El número de página no es válido." });
  }
  if (!CATEGORIES.includes(category) || !GAMES.includes(game)) {
    return jsonResponse(400, { error: "El filtro del catálogo no es válido." });
  }
  if (releaseSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(releaseSlug)) {
    return jsonResponse(400, { error: "El lanzamiento no es válido." });
  }
  if (classType !== "all" && !/^[0-3]$/.test(classType)) {
    return jsonResponse(400, { error: "El filtro de clase no es válido." });
  }

  const values = [];
  const where = [releaseSlug ? "EXISTS (SELECT 1 FROM release_catalog_entries rce WHERE rce.catalog_entry_id = c.id AND rce.release_slug = $1)" : "TRUE"];
  if (releaseSlug) values.push(releaseSlug);
  if (query.id) {
    if (!/^\d+$/.test(query.id)) {
      return jsonResponse(400, { error: "El identificador de catálogo no es válido." });
    }
    values.push(query.id);
    where.push(`c.id = $${values.length}`);
  }
  if (category !== "all") {
    values.push(category);
    where.push(`c.category = $${values.length}`);
  }
  if (game !== "all") {
    values.push(game);
    where.push(`c.source_game = $${values.length}`);
  }
  if (rarity) {
    values.push(rarity);
    where.push(`c.rarity = $${values.length}`);
  }
  if (classType !== "all") {
    values.push(Number(classType));
    where.push(`c.class_type = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    where.push(`(c.title_es ILIKE $${values.length} OR c.title_en ILIKE $${values.length} OR c.summary_es ILIKE $${values.length})`);
  }
  const whereSql = where.join(" AND ");
  const catalogEntriesSql = `SELECT c.*,
                                    ROW_NUMBER() OVER (
                                      PARTITION BY c.source_game, c.category,
                                        CASE WHEN c.category IN ('weapons', 'armor')
                                          THEN lower(regexp_replace(btrim(c.title_en), '\\s+', ' ', 'g'))
                                          ELSE c.title_en
                                        END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.title_es, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.summary_es, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.image_url, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.icon_url, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.rarity, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN COALESCE(c.class_type, -1) ELSE -1 END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.item_type, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.description_en, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.description_es, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.flavor_text_en, '') END,
                                        CASE WHEN c.category IN ('weapons', 'armor') THEN '' ELSE COALESCE(c.flavor_text_es, '') END
                                      ORDER BY
                                        CASE c.rarity
                                          WHEN 'Excepcional' THEN 0
                                          WHEN 'Leyenda' THEN 1
                                          WHEN 'Peculiar' THEN 2
                                          WHEN 'Poco común' THEN 3
                                          WHEN 'Común' THEN 4
                                          ELSE 5
                                        END,
                                        (c.image_url IS NOT NULL OR c.icon_url IS NOT NULL) DESC,
                                        (c.description_es IS NOT NULL) DESC,
                                        c.id
                                    ) AS duplicate_rank
                             FROM game_catalog_entries c
                             WHERE ${whereSql}`;

  try {
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM (${catalogEntriesSql}) entries
       WHERE duplicate_rank = 1`,
      values,
    );
    const total = count.rows[0].total;
    const offset = (page - 1) * PAGE_SIZE;
    const itemValues = [...values, PAGE_SIZE, offset];
    const result = await pool.query(
      `SELECT entries.id::text AS id, entries.bungie_id AS "bungieId",
              entries.source_game AS "sourceGame", entries.category,
              COALESCE(NULLIF(entries.title_es, ''), entries.title_en) AS title,
              entries.title_en AS "titleEn", entries.summary_es AS "summaryEs", entries.image_url AS "imageUrl",
              entries.description_en AS "descriptionEn", entries.description_es AS "descriptionEs",
              entries.flavor_text_en AS "flavorTextEn", entries.flavor_text_es AS "flavorTextEs",
              entries.image_kind AS "imageKind", entries.rarity, entries.class_type AS "classType",
              entries.item_type AS "itemType", entries.icon_url AS "iconUrl",
              entries.source_url AS "sourceUrl"
       FROM (${catalogEntriesSql}) entries
       WHERE entries.duplicate_rank = 1
       ORDER BY entries.title_es NULLS LAST, entries.title_en, entries.id
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
    console.error("No se pudo consultar el catálogo del juego:", error);
    return jsonResponse(500, { error: "No se pudo consultar el catálogo del juego." });
  }
}
