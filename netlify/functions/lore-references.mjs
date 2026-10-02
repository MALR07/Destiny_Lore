import { pool, jsonResponse } from "./lib/db.mjs";

const MAX_REFERENCES = 24;
const MIN_TERM_LENGTH = 4;

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Método no permitido." });
  }

  const id = event.queryStringParameters?.id?.trim();
  if (!id || !/^\d+$/.test(id)) {
    return jsonResponse(400, { error: "El identificador del relato no es válido." });
  }

  try {
    const result = await pool.query(
      `WITH source_entry AS (
         SELECT btrim(lower(regexp_replace(
           regexp_replace(coalesce(content_es, '') || ' ' || content_en, '<[^>]*>', ' ', 'g'),
           '[^[:alnum:]]+', ' ', 'g'
         ))) AS body
         FROM lore_entries
         WHERE id = $1
       ),
       candidates AS (
         SELECT
           'catalog'::text AS kind,
           c.id::text AS id,
           c.source_game AS "sourceGame",
           c.category,
           COALESCE(NULLIF(c.title_es, ''), c.title_en) AS title,
           c.title_en AS "titleEn",
           c.image_url AS "imageUrl",
           c.image_kind AS "imageKind",
           c.source_url AS "sourceUrl",
           term.name AS matched_name,
           length(term.name) AS term_length
         FROM game_catalog_entries c
         CROSS JOIN source_entry s
         CROSS JOIN LATERAL unnest(ARRAY[c.title_es, c.title_en]) AS term(name)
         WHERE c.category IN ('characters', 'places', 'weapons')
           AND length(term.name) >= $2
           AND strpos(
             ' ' || s.body || ' ',
             ' ' || btrim(regexp_replace(lower(term.name), '[^[:alnum:]]+', ' ', 'g')) || ' '
           ) > 0
       ),
       best_matches AS (
         SELECT DISTINCT ON (kind, id) *
         FROM candidates
         ORDER BY kind, id, term_length DESC
       )
       SELECT kind, id, "sourceGame", category, title, "titleEn",
              "imageUrl", "imageKind", "sourceUrl", matched_name AS "matchedName"
       FROM best_matches
       ORDER BY term_length DESC, title
       LIMIT $3`,
      [id, MIN_TERM_LENGTH, MAX_REFERENCES],
    );
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
      },
      body: JSON.stringify({ items: result.rows }),
    };
  } catch (error) {
    console.error("No se pudieron encontrar referencias del relato:", error);
    return jsonResponse(500, { error: "No se pudieron encontrar referencias del relato." });
  }
}
