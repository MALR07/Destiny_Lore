const MAX_CHUNK_LENGTH = 12_000;

function splitLongParagraph(paragraph) {
  const chunks = [];
  let remaining = paragraph.trim();
  while (remaining.length > MAX_CHUNK_LENGTH) {
    let splitAt = remaining.lastIndexOf(" ", MAX_CHUNK_LENGTH);
    if (splitAt < MAX_CHUNK_LENGTH * 0.6) splitAt = MAX_CHUNK_LENGTH;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function splitDestinyText(content) {
  const chunks = [];
  let current = "";
  for (const paragraph of content.split(/\n{2,}/)) {
    const pieces = splitLongParagraph(paragraph);
    for (const piece of pieces) {
      const next = current ? `${current}\n\n${piece}` : piece;
      if (next.length > MAX_CHUNK_LENGTH && current) {
        chunks.push(current);
        current = piece;
      } else {
        current = next;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(apiKey, model, title, content, index, total) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Traduce al español de España el texto de Destiny de forma natural y fiel.",
            "Respeta el tono, la voz, los nombres propios y los saltos de párrafo.",
            "Usa la terminología oficial española de Destiny cuando sea reconocible.",
            "No resumas ni añadas explicaciones.",
            'Devuelve JSON válido con las claves "titleEs" y "contentEs".',
          ].join(" "),
        },
        {
          role: "user",
          content: `Título: ${title}${total > 1 ? ` (fragmento ${index + 1} de ${total})` : ""}\n\nTexto:\n${content}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    throw new Error(`El proveedor de traducción rechazó un fragmento con HTTP ${response.status}.`);
  }
  const payload = await response.json();
  let translation;
  try {
    translation = JSON.parse(payload.choices?.[0]?.message?.content ?? "");
  } catch {
    throw new Error("El proveedor devolvió una traducción con formato no válido.");
  }
  if (
    typeof translation?.titleEs !== "string" || !translation.titleEs.trim()
    || typeof translation?.contentEs !== "string" || !translation.contentEs.trim()
  ) {
    throw new Error("El proveedor no devolvió título y texto traducidos.");
  }
  return {
    titleEs: translation.titleEs.trim(),
    contentEs: translation.contentEs.trim(),
  };
}

export async function translateDestinyText(apiKey, model, title, content) {
  if (!content.trim()) throw new Error("No hay texto para traducir.");
  const chunks = splitDestinyText(content);
  const translations = [];
  for (const [index, chunk] of chunks.entries()) {
    translations.push(await translateChunk(apiKey, model, title, chunk, index, chunks.length));
  }
  return {
    titleEs: translations[0].titleEs,
    contentEs: translations.map(({ contentEs }) => contentEs).join("\n\n"),
  };
}
