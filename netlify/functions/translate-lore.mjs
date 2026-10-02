import { pool, jsonResponse } from "./lib/db.mjs";
import { reserveTranslation } from "./lib/translation-limits.mjs";

const MAX_SOURCE_LENGTH = 20_000;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Método no permitido." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(503, { error: "La traducción automática no está configurada." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body ?? "");
  } catch {
    return jsonResponse(400, { error: "El cuerpo de la solicitud no contiene JSON válido." });
  }
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!/^\d+$/.test(id)) {
    return jsonResponse(400, { error: "El identificador del relato no es válido." });
  }

  try {
    const entryResult = await pool.query(
      "SELECT id, title_en, title_es, content_en, content_es FROM lore_entries WHERE id = $1",
      [id],
    );
    const entry = entryResult.rows[0];
    if (!entry) return jsonResponse(404, { error: "No se encontró el relato solicitado." });
    if (entry.content_es) {
      return jsonResponse(200, {
        titleEs: entry.title_es || entry.title_en,
        contentEs: entry.content_es,
      });
    }
    if (!entry.content_en?.trim()) {
      return jsonResponse(422, { error: "Este relato no tiene texto original para traducir." });
    }
    if (entry.content_en.length > MAX_SOURCE_LENGTH) {
      return jsonResponse(413, { error: "El relato es demasiado extenso para traducirlo de una vez." });
    }
    const clientAddress = event.headers?.["x-nf-client-connection-ip"] ?? "unknown";
    if (!(await reserveTranslation(pool, clientAddress))) {
      return jsonResponse(429, { error: "Se alcanzó el límite diario de traducciones." });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "Traduce el texto de Destiny al español de España, natural y fiel al original.",
              "Respeta el tono narrativo, la voz del personaje y los saltos de párrafo.",
              "Usa la terminología oficial española de Destiny cuando sea reconocible:",
              "Guardián, Viajero, Luz, Oscuridad, Colmena, Caídos, Poseídos, Despreciados, Vex, Cabal, Despertados, Espectro y Testigo.",
              "No resumas, no añadas explicaciones ni inventes contenido.",
              'Devuelve un objeto JSON válido con las claves "titleEs" y "contentEs", ambas con texto traducido.',
            ].join(" "),
          },
          {
            role: "user",
            content: `Título: ${entry.title_en}\n\nTexto:\n${entry.content_en}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("El proveedor de traducción rechazó la solicitud:", aiResponse.status, errorText);
      return jsonResponse(502, { error: "El servicio de traducción no pudo completar la solicitud." });
    }

    const aiBody = await aiResponse.json();
    const translationText = aiBody.choices?.[0]?.message?.content;
    let translation;
    try {
      translation = JSON.parse(translationText ?? "");
    } catch {
      console.error("El proveedor devolvió una traducción que no es JSON válido.");
      return jsonResponse(502, { error: "El servicio de traducción devolvió un formato inesperado." });
    }
    if (
      !translation || typeof translation !== "object" ||
      typeof translation.titleEs !== "string" || !translation.titleEs.trim() ||
      typeof translation.contentEs !== "string" || !translation.contentEs.trim()
    ) {
      console.error("La respuesta de traducción no contenía el título o el texto.");
      return jsonResponse(502, { error: "El servicio de traducción devolvió una respuesta incompleta." });
    }

    const savedResult = await pool.query(
      `UPDATE lore_entries
       SET title_es = COALESCE(NULLIF(title_es, ''), $1),
           content_es = COALESCE(NULLIF(content_es, ''), $2),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING title_es, content_es`,
      [translation.titleEs.trim(), translation.contentEs.trim(), id],
    );
    return jsonResponse(200, {
      titleEs: savedResult.rows[0].title_es,
      contentEs: savedResult.rows[0].content_es,
    });
  } catch (error) {
    console.error("No se pudo traducir el relato:", error);
    return jsonResponse(500, { error: "No se pudo traducir el relato." });
  }
}
