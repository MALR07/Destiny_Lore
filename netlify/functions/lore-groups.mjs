import { pool, jsonResponse } from "./lib/db.mjs";

const GROUP_TYPES = ["category", "book", "release"];

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Método no permitido." });
  }

  const query = event.queryStringParameters ?? {};
  const requestedType = query.type ?? "category";
  const type = requestedType;
  const search = (query.q ?? "").trim().slice(0, 120);
  if (!GROUP_TYPES.includes(type)) {
    return jsonResponse(400, { error: "El tipo de índice no es válido." });
  }

  const values = [type];
  const where = ["g.group_type = $1"];
  if (search) {
    values.push(`%${search}%`);
    where.push(`(g.title_es ILIKE $${values.length} OR g.title_en ILIKE $${values.length})`);
  }
  try {
    const result = await pool.query(
      `SELECT g.id::text AS id, g.group_type AS "groupType",
              g.source_game AS "sourceGame",
              COALESCE(NULLIF(g.title_es, ''), g.title_en) AS title,
              g.title_en AS "titleEn",
              COALESCE(
                g.image_url,
                (SELECT e.image_url
                 FROM lore_group_entries image_ge
                 JOIN lore_entries e ON e.id = image_ge.lore_entry_id
                 WHERE image_ge.group_id = g.id AND e.image_url IS NOT NULL
                 ORDER BY CASE WHEN e.image_kind = 'artwork' THEN 0 ELSE 1 END,
                          image_ge.sort_order, e.id
                 LIMIT 1)
              ) AS "imageUrl",
              g.source_url AS "sourceUrl",
              g.release_number AS "releaseNumber", g.release_order AS "releaseOrder",
              g.release_slug AS "releaseSlug",
              (SELECT COALESCE(NULLIF(r.title_es, ''), r.title_en)
               FROM lore_groups r
               WHERE r.group_type = 'release' AND r.release_slug = g.release_slug
               ORDER BY r.release_order NULLS LAST, r.id
               LIMIT 1) AS "releaseTitle",
              COALESCE(
                (SELECT r.image_url
                 FROM lore_groups r
                 WHERE r.group_type = 'release' AND r.release_slug = g.release_slug
                 ORDER BY r.release_order NULLS LAST, r.id
                 LIMIT 1),
                (SELECT e.image_url
                 FROM lore_groups r
                 JOIN lore_groups book ON book.group_type = 'book'
                   AND book.release_slug = r.release_slug
                 JOIN lore_group_entries ge ON ge.group_id = book.id
                 JOIN lore_entries e ON e.id = ge.lore_entry_id
                 WHERE r.group_type = 'release'
                   AND r.release_slug = g.release_slug
                   AND e.image_url IS NOT NULL
                 ORDER BY CASE WHEN e.image_kind = 'artwork' THEN 0 ELSE 1 END,
                          ge.sort_order, e.id
                 LIMIT 1)
              ) AS "releaseImageUrl",
              COALESCE(
                (SELECT CASE WHEN r.image_url IS NOT NULL THEN 'artwork' END
                 FROM lore_groups r
                 WHERE r.group_type = 'release' AND r.release_slug = g.release_slug
                 ORDER BY r.release_order NULLS LAST, r.id
                 LIMIT 1),
                (SELECT e.image_kind
                 FROM lore_groups r
                 JOIN lore_groups book ON book.group_type = 'book'
                   AND book.release_slug = r.release_slug
                 JOIN lore_group_entries ge ON ge.group_id = book.id
                 JOIN lore_entries e ON e.id = ge.lore_entry_id
                 WHERE r.group_type = 'release'
                   AND r.release_slug = g.release_slug
                   AND e.image_url IS NOT NULL
                 ORDER BY CASE WHEN e.image_kind = 'artwork' THEN 0 ELSE 1 END,
                          ge.sort_order, e.id
                 LIMIT 1)
              ) AS "releaseImageKind",
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id', preview.id::text,
                  'title', COALESCE(NULLIF(preview.title_es, ''), preview.title_en)
                ) ORDER BY preview.sort_order, lower(COALESCE(NULLIF(preview.title_es, ''), preview.title_en)))
                FROM (
                  SELECT e.id, e.title_es, e.title_en, ge.sort_order
                  FROM lore_group_entries ge
                  JOIN lore_entries e ON e.id = ge.lore_entry_id
                  WHERE ge.group_id = g.id
                  ORDER BY ge.sort_order, lower(COALESCE(NULLIF(e.title_es, ''), e.title_en)), e.id
                  LIMIT 3
                ) preview
              ), '[]'::json) AS "lorePreview",
              COUNT(ge.lore_entry_id)::int AS "entryCount",
              COUNT(ge.lore_entry_id)::int AS "localEntryCount",
              (SELECT COUNT(*)::int
               FROM release_catalog_entries rce
               WHERE rce.release_slug = g.release_slug) AS "catalogItemCount"
       FROM lore_groups g
       LEFT JOIN lore_group_entries ge ON ge.group_id = g.id
       WHERE ${where.join(" AND ")}
       GROUP BY g.id
       ORDER BY
         g.release_order ASC NULLS LAST,
         g.release_number NULLS LAST,
         lower(COALESCE(NULLIF(g.title_es, ''), g.title_en)), g.id`,
      values,
    );
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
      body: JSON.stringify({ items: result.rows }),
    };
  } catch (error) {
    console.error("No se pudo consultar el índice de grupos de lore:", error);
    return jsonResponse(500, { error: "No se pudo consultar el índice de grupos de lore." });
  }
}
