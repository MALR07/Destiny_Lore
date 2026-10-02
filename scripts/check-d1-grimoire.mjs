import { getD1LocalizedWorldPath } from "./lore-manifest.mjs";

const API_URL = "https://www.bungie.net/d1/Platform/Destiny/Manifest/";

async function main() {
  const apiKey = process.env.BUNGIE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("BUNGIE_API_KEY no está configurada. Añádela a .env y recrea el contenedor app.");
  }

  const response = await fetch(API_URL, {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`El endpoint de Destiny 1 respondió HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.ErrorCode !== 1) {
    throw new Error(
      `Bungie rechazó la consulta: ${payload.ErrorStatus ?? payload.Message ?? "error desconocido"} (${payload.ErrorCode}).`,
    );
  }

  const locales = Object.keys(payload.Response?.mobileWorldContentPaths ?? {});
  const spanishWorldPath = getD1LocalizedWorldPath(payload, "es");
  console.log("Consulta autenticada al manifiesto de Destiny 1 aceptada por Bungie.");
  console.log(`Versión del manifiesto: ${payload.Response.version ?? "no indicada"}`);
  console.log(`Idiomas disponibles: ${locales.join(", ") || "(ninguno)"}`);
  console.log(`Datos del mundo en español disponibles: ${Boolean(spanishWorldPath)}`);
  console.log("Este archivo .content debe extraerse como ZIP y abrirse como SQLite para leer el Grimorio.");
}

try {
  await main();
} catch (error) {
  console.error("No se pudo comprobar el Grimorio de Destiny 1:", error);
  process.exitCode = 1;
}
