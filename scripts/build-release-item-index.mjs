import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import he from "he";

const ARCHIVE_URL = (process.env.ARCHIVE_BASE_URL ?? "http://localhost:8888").replace(/\/$/, "");
const ISHTAR_URL = "https://www.ishtar-collective.net";
const ISHTAR_PAGE_SIZE = 20;
const ISHTAR_CONCURRENCY = 5;
const API_CONCURRENCY = 8;
const CATALOG_PAGE_SIZE = 24;
const REPOSITORY_NAME = basename(dirname(dirname(fileURLToPath(import.meta.url))));
const CRAWL_CACHE = join(tmpdir(), `${REPOSITORY_NAME}-ishtar-item-pages.json`);

async function fetchResponse(url, timeout = 30_000) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`HTTP ${response.status} al consultar ${url}.`);
      }
      if (attempt === 3) throw new Error(`HTTP ${response.status} al consultar ${url} tras varios intentos.`);
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 500 * (2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      if (error instanceof Error && /^HTTP 4\d\d/.test(error.message)) throw error;
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw new Error(`No se pudo consultar ${url}.`);
}

async function mapConcurrent(values, concurrency, callback) {
  let cursor = 0;
  const results = new Array(values.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await callback(values[index], index);
    }
  }));
  return results;
}

function normalizeTitle(value) {
  return he.decode(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase("en");
}

function iconFilename(value) {
  try {
    return decodeURIComponent(new URL(value).pathname.split("/").pop() ?? "").toLocaleLowerCase("en");
  } catch {
    return "";
  }
}

function catalogMetadata(item) {
  const summary = item.summaryEs?.split(" · ") ?? [];
  const classType = Number.isInteger(item.classType)
    ? item.classType
    : ({
      "para Titán": 0,
      "para Cazador": 1,
      "para Hechicero": 2,
      "para todas las clases": 3,
    })[summary.find((part) => part.startsWith("para "))]
      ?? null;
  return {
    classType,
    rarity: item.rarity ?? summary.find((part, index) =>
      index >= 2 && !part.startsWith("para ") && !part.startsWith("Registro del equipo")),
    itemType: item.itemType ?? (summary[1]?.startsWith("Registro del equipo") ? null : summary[1]) ?? null,
  };
}

function parseIshtarItems(html) {
  return [...html.matchAll(/<div class="item-thumbnail col-2">([\s\S]*?)<\/a>/g)]
    .flatMap(([, card]) => {
      const slug = card.match(/href="\/items\/([^"]+)"/)?.[1];
      const imageUrl = card.match(/data-src="([^"]+)"/)?.[1];
      const title = card.match(/<div class="title">([\s\S]*?)<\/div>/)?.[1];
      if (!slug || !title) return [];
      return [{
        slug,
        imageUrl: imageUrl ?? null,
        title: he.decode(title.replace(/<[^>]*>/g, "").trim()),
      }];
    });
}

async function loadIshtarRelease(release, progress, cache, saveCache) {
  const releaseCache = cache[release.slug] ?? {};
  cache[release.slug] = releaseCache;
  if (!releaseCache[1]) {
    const firstUrl = `${ISHTAR_URL}/releases/${release.slug}/items`;
    const firstHtml = await fetchResponse(firstUrl).then((response) => response.text());
    const total = Number(firstHtml.match(/>([\d,]+) Items<\/a>/)?.[1]?.replaceAll(",", "") ?? 0);
    releaseCache[1] = { total, items: parseIshtarItems(firstHtml) };
    await saveCache();
  }
  const total = releaseCache[1].total;
  const pageCount = Math.ceil(total / ISHTAR_PAGE_SIZE);
  const pages = Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => index + 2)
    .filter((page) => !releaseCache[page]);
  for (let start = 0; start < pages.length; start += 25) {
    const batch = pages.slice(start, start + 25);
    await mapConcurrent(batch, ISHTAR_CONCURRENCY, async (page) => {
      const url = `${ISHTAR_URL}/releases/${release.slug}/items/page/${page}`;
      const response = await fetchResponse(url, 90_000);
      const html = await response.text();
      if (!html.includes('class="item-thumbnail col-2"') && (page - 1) * ISHTAR_PAGE_SIZE < total) {
        throw new Error(`La página ${page} de items de ${release.slug} no contiene los resultados esperados.`);
      }
      releaseCache[page] = { items: parseIshtarItems(html) };
      progress();
      return null;
    });
    await saveCache();
  }
  const items = Object.keys(releaseCache)
    .sort((left, right) => Number(left) - Number(right))
    .flatMap((page) => releaseCache[page].items);
  if (items.length !== total) {
    throw new Error(`${release.slug}: Ishtar anuncia ${total} items, pero se leyeron ${items.length}.`);
  }
  return items;
}

async function readCrawlCache() {
  try {
    return JSON.parse(await readFile(CRAWL_CACHE, "utf8"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return {};
    throw error;
  }
}

async function loadOfficialCatalog() {
  const firstUrl = new URL("/api/catalog", ARCHIVE_URL);
  firstUrl.search = new URLSearchParams({ game: "all", category: "all", page: "1" }).toString();
  const first = await fetchResponse(firstUrl).then((response) => response.json());
  const pageCount = Math.ceil(first.total / CATALOG_PAGE_SIZE);
  const pages = Array.from({ length: pageCount - 1 }, (_, index) => index + 2);
  const remaining = await mapConcurrent(pages, API_CONCURRENCY, async (page) => {
    const url = new URL("/api/catalog", ARCHIVE_URL);
    url.search = new URLSearchParams({
      game: "all",
      category: "all",
      page: String(page),
    }).toString();
    const data = await fetchResponse(url).then((response) => response.json());
    if (data.items.length === 0) throw new Error(`La página ${page} del catálogo oficial está vacía.`);
    return data.items;
  });
  const allItems = [...first.items, ...remaining.flat()];
  if (allItems.length !== first.total) {
    throw new Error(`El catálogo oficial está incompleto: llegaron ${allItems.length} de ${first.total} registros.`);
  }
  const items = allItems
    .filter((item) => ["weapons", "armor", "objects"].includes(item.category));
  return items;
}

function matchItem(ishtarItem, sourceGame, catalogByTitle) {
  const titleKey = normalizeTitle(ishtarItem.title);
  const candidates = (catalogByTitle.get(`${sourceGame}:${titleKey}`) ?? []);
  if (candidates.length === 0) return [];
  const filename = iconFilename(ishtarItem.imageUrl);
  const exactImage = filename
    ? candidates.filter((candidate) => iconFilename(candidate.iconUrl ?? candidate.imageUrl) === filename)
    : [];
  const matched = exactImage.length > 0 ? exactImage : candidates.length === 1 ? candidates : [];
  return matched.map((candidate) => {
    const iconUrl = exactImage.length > 0
      ? ishtarItem.imageUrl
      : candidate.iconUrl ?? candidate.imageUrl ?? null;
    return {
      sourceGame,
      titleEn: candidate.titleEn,
      iconUrl: iconUrl?.endsWith("/missing_icon.png") ? null : iconUrl,
      category: candidate.category,
      ...catalogMetadata(candidate),
      ishtarItemSlug: ishtarItem.slug,
    };
  });
}

async function main() {
  const releaseIndex = JSON.parse(
    await readFile(new URL("../data/release-index.json", import.meta.url), "utf8"),
  );
  const catalog = await loadOfficialCatalog();
  const catalogByTitle = new Map();
  for (const item of catalog) {
    const key = `${item.sourceGame}:${normalizeTitle(item.titleEn)}`;
    const candidates = catalogByTitle.get(key) ?? [];
    candidates.push(item);
    catalogByTitle.set(key, candidates);
  }

  let completedPages = 0;
  const crawlCache = await readCrawlCache();
  const saveCache = () => writeFile(CRAWL_CACHE, JSON.stringify(crawlCache), "utf8");
  const releases = await mapConcurrent(releaseIndex, 1, async (release) => {
    const items = await loadIshtarRelease(release, () => {
      completedPages += 1;
      if (completedPages % 200 === 0) console.log(`Leídas ${completedPages.toLocaleString("es-ES")} páginas de items…`);
    }, crawlCache, saveCache);
    const matched = items.flatMap((item) => matchItem(item, release.sourceGame, catalogByTitle));
    const unique = new Map();
    for (const item of matched) {
      const key = [
        item.category,
        normalizeTitle(item.titleEn),
        iconFilename(item.iconUrl),
        item.classType ?? "",
        item.rarity ?? "",
        item.itemType ?? "",
      ].join(":");
      if (!unique.has(key)) unique.set(key, item);
    }
    console.log(`${release.title}: ${items.length.toLocaleString("es-ES")} documentos, ${unique.size.toLocaleString("es-ES")} items oficiales coincidentes.`);
    return [release.slug, [...unique.values()]];
  });

  const result = Object.fromEntries(releases);
  await writeFile(
    new URL("../data/release-item-index.json", import.meta.url),
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8",
  );
  await rm(CRAWL_CACHE, { force: true });
  const total = Object.values(result).reduce((sum, items) => sum + items.length, 0);
  console.log(`Índice local creado con ${total.toLocaleString("es-ES")} items Bungie/Ishtar coincidentes.`);
}

try {
  await main();
} catch (error) {
  console.error("No se pudo generar el índice editorial de items por lanzamiento:", error);
  process.exitCode = 1;
}
