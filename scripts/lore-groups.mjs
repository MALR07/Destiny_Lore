import he from "he";
import { getBungieImageUrl } from "./lore-manifest.mjs";

function text(value) {
  return typeof value === "string" ? he.decode(value).trim() : "";
}

function normalize(value) {
  return text(value).normalize("NFKD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function releaseKey(value) {
  return normalize(value).replace(/^(?:season of|season|episode)\s+/, "");
}

function getNodeLoreHashes(hash, nodes, records, visited = new Set()) {
  const key = String(hash);
  if (visited.has(key)) return [];
  visited.add(key);
  const node = nodes[key];
  if (!node) return [];
  const direct = (node.children?.records ?? [])
    .map((entry) => records[String(entry.recordHash)]?.loreHash)
    .map((loreHash) => String(loreHash ?? ""))
    .filter((loreHash) => Boolean(loreHash) && loreHash !== "0");
  const nested = (node.children?.presentationNodes ?? [])
    .flatMap((entry) => getNodeLoreHashes(entry.presentationNodeHash, nodes, records, visited));
  return [...new Set([...direct, ...nested])];
}

export function mapLoreGroups(
  englishNodes,
  spanishNodes,
  englishSeasons,
  spanishSeasons,
  englishRecords,
  editorialBookIndex,
  knownReleases,
  sourceUrls,
) {
  const groups = [];
  const ancestors = new Set();
  const releaseBySlug = new Map(knownReleases.map((release) => [release.slug, release]));
  const releaseTitles = new Set(knownReleases.map((release) => releaseKey(release.title)));
  const bookByTitle = new Map();

  for (const [releaseSlug, titles] of Object.entries(editorialBookIndex)) {
    const release = releaseBySlug.get(releaseSlug);
    if (!release) throw new Error(`El índice editorial hace referencia al lanzamiento desconocido "${releaseSlug}".`);
    for (const title of titles) {
      const key = normalize(title);
      if (bookByTitle.has(key)) {
        throw new Error(`El título editorial "${title}" está asignado a más de un lanzamiento.`);
      }
      bookByTitle.set(key, release);
    }
  }

  function addAncestors(node, visited = new Set()) {
    for (const parentHash of node.parentNodeHashes ?? []) {
      const key = String(parentHash);
      if (visited.has(key)) continue;
      visited.add(key);
      ancestors.add(key);
      const parent = englishNodes[key];
      if (parent) addAncestors(parent, visited);
    }
  }

  for (const [hash, node] of Object.entries(englishNodes)) {
    if (!node || node.redacted || !(node.children?.records?.length > 0)) continue;
    const loreHashes = getNodeLoreHashes(hash, englishNodes, englishRecords);
    if (loreHashes.length === 0) continue;
    addAncestors(node);

    const localized = spanishNodes[hash];
    const titleEn = text(node.displayProperties?.name);
    const titleEs = text(localized?.displayProperties?.name);
    if (!titleEn) continue;
    if (releaseTitles.has(releaseKey(titleEn))) continue;
    const release = bookByTitle.get(normalize(titleEn));
    groups.push({
      groupType: release ? "book" : "category",
      sourceGame: "destiny2",
      bungieId: hash,
      titleEn: titleEn.slice(0, 255),
      titleEs: titleEs ? titleEs.slice(0, 255) : null,
      imageUrl: getBungieImageUrl(localized?.displayProperties?.icon || node.displayProperties?.icon),
      sourceUrl: sourceUrls.presentation,
      releaseNumber: null,
      releaseOrder: release?.releaseOrder ?? null,
      releaseSlug: release?.slug ?? null,
      loreHashes,
    });
  }

  for (const hash of ancestors) {
    const node = englishNodes[hash];
    if (!node || node.redacted) continue;
    const titleEn = text(node.displayProperties?.name);
    if (!titleEn || releaseTitles.has(releaseKey(titleEn))) continue;
    const localized = spanishNodes[hash];
    const loreHashes = getNodeLoreHashes(hash, englishNodes, englishRecords);
    if (loreHashes.length === 0) continue;
    groups.push({
      groupType: "category",
      sourceGame: "destiny2",
      bungieId: hash,
      titleEn: titleEn.slice(0, 255),
      titleEs: text(localized?.displayProperties?.name).slice(0, 255) || null,
      imageUrl: getBungieImageUrl(localized?.displayProperties?.icon || node.displayProperties?.icon),
      sourceUrl: sourceUrls.presentation,
      releaseNumber: null,
      releaseOrder: null,
      releaseSlug: null,
      loreHashes,
    });
  }

  const seasonsByHash = new Map();
  const seasonTitles = new Map();
  for (const [hash, season] of Object.entries(englishSeasons)) {
    if (!season || season.redacted) continue;
    const titleEn = text(season.displayProperties?.name);
    if (!titleEn) continue;
    const localized = spanishSeasons[hash];
    const titleEs = text(localized?.displayProperties?.name);
    const keys = new Set([normalize(titleEn), normalize(titleEs)].filter(Boolean));
    const item = { hash, titleEn, titleEs, season };
    seasonsByHash.set(hash, item);
    for (const key of keys) seasonTitles.set(key, item);
  }

  for (const season of seasonsByHash.values()) {
    const matchingNodes = Object.entries(englishNodes)
      .filter(([, node]) => seasonTitles.has(normalize(text(node?.displayProperties?.name)))
        && seasonTitles.get(normalize(text(node?.displayProperties?.name))).hash === season.hash)
      .map(([hash]) => hash);
    const loreHashes = [...new Set(matchingNodes.flatMap((hash) =>
      getNodeLoreHashes(hash, englishNodes, englishRecords)))];
    const localized = spanishSeasons[season.hash];
    groups.push({
      groupType: "release",
      sourceGame: "destiny2",
      bungieId: season.hash,
      titleEn: season.titleEn.slice(0, 255),
      titleEs: season.titleEs ? season.titleEs.slice(0, 255) : null,
      imageUrl: getBungieImageUrl(localized?.displayProperties?.icon || season.season.displayProperties?.icon),
      sourceUrl: sourceUrls.seasons,
      releaseNumber: Number.isInteger(season.season.seasonNumber) ? season.season.seasonNumber : null,
      releaseOrder: null,
      releaseSlug: null,
      loreHashes,
    });
  }

  const unique = new Map();
  for (const group of groups) {
    if (group.groupType !== "release" && group.loreHashes.length === 0) continue;
    const key = `${group.groupType}:${group.bungieId}`;
    const existing = unique.get(key);
    unique.set(key, existing
      ? { ...existing, loreHashes: [...new Set([...existing.loreHashes, ...group.loreHashes])] }
      : group);
  }
  return [...unique.values()];
}

export function mergeKnownReleases(bungieGroups, knownReleases) {
  const releases = bungieGroups.filter((group) => group.groupType === "release");
  const bookLoreByRelease = new Map();
  for (const group of bungieGroups) {
    if (group.groupType !== "book" || !group.releaseSlug) continue;
    const loreHashes = bookLoreByRelease.get(group.releaseSlug) ?? [];
    bookLoreByRelease.set(group.releaseSlug, [...new Set([...loreHashes, ...group.loreHashes])]);
  }
  const officialByKey = new Map();
  for (const group of releases) {
    const key = releaseKey(group.titleEn);
    const existing = officialByKey.get(key);
    officialByKey.set(key, existing
      ? {
        ...group,
        ...existing,
        titleEs: existing.titleEs || group.titleEs,
        imageUrl: existing.imageUrl || group.imageUrl,
        sourceUrl: existing.sourceUrl || group.sourceUrl,
        releaseNumber: existing.releaseNumber ?? group.releaseNumber,
        loreHashes: [...new Set([...group.loreHashes, ...existing.loreHashes])],
      }
      : group);
  }
  const merged = [];

  for (const [index, release] of knownReleases.entries()) {
    const key = releaseKey(release.title);
    const bungie = officialByKey.get(key);
    merged.push({
      ...(bungie ?? {}),
      groupType: "release",
      sourceGame: release.sourceGame,
      bungieId: bungie?.bungieId ?? `local:${release.slug}`,
      titleEn: bungie?.titleEn ?? release.title,
      titleEs: bungie?.titleEs ?? release.titleEs,
      imageUrl: bungie?.imageUrl ?? null,
      sourceUrl: bungie?.sourceUrl ?? null,
      releaseNumber: bungie?.releaseNumber ?? release.releaseNumber ?? null,
      releaseOrder: release.releaseOrder ?? index + 1,
      releaseSlug: release.slug,
      loreHashes: [...new Set([
        ...(bungie?.loreHashes ?? []),
        ...(bookLoreByRelease.get(release.slug) ?? []),
      ])],
    });
  }

  return [
    ...bungieGroups.filter((group) => group.groupType !== "release"),
    ...merged,
  ];
}

export function mapD1EditorialBooks(editorialBookIndex, knownReleases, d1LoreEntries) {
  const releasesBySlug = new Map(knownReleases.map((release) => [release.slug, release]));
  const loreByTitle = new Map();
  for (const entry of d1LoreEntries) {
    const key = normalize(entry.titleEn);
    if (loreByTitle.has(key)) {
      loreByTitle.set(key, null);
      continue;
    }
    loreByTitle.set(key, entry);
  }
  const groups = [];

  for (const [releaseSlug, books] of Object.entries(editorialBookIndex)) {
    const release = releasesBySlug.get(releaseSlug);
    if (!release) throw new Error(`El índice editorial D1 hace referencia al lanzamiento desconocido "${releaseSlug}".`);
    if (release.sourceGame !== "destiny1") {
      throw new Error(`El libro D1 "${releaseSlug}" está asignado a un lanzamiento que no es de Destiny 1.`);
    }
    for (const book of books) {
      if (!book.slug || !book.title || !Array.isArray(book.cards) || book.cards.length === 0) {
        throw new Error(`La definición editorial D1 de "${releaseSlug}" no es válida.`);
      }
      const loreHashes = book.cards.flatMap((title) => {
        const entry = loreByTitle.get(normalize(title));
        return entry ? [entry.bungieId] : [];
      });
      groups.push({
        groupType: "book",
        sourceGame: "destiny1",
        bungieId: `d1-book:${book.slug}`,
        titleEn: text(book.title).slice(0, 255),
        titleEs: text(book.titleEs).slice(0, 255) || null,
        imageUrl: null,
        sourceUrl: null,
        releaseNumber: null,
        releaseOrder: release.releaseOrder,
        releaseSlug,
        loreHashes: [...new Set(loreHashes)],
      });
    }
  }
  return groups;
}

export function findUnmatchedD1EditorialBooks(editorialBookIndex, d1LoreEntries) {
  const loreTitles = new Set(d1LoreEntries.map((entry) => normalize(entry.titleEn)));
  return Object.values(editorialBookIndex)
    .flat()
    .flatMap((book) => book.cards.filter((title) => !loreTitles.has(normalize(title)))
      .map((title) => ({ book: book.title, title })));
}

export function findUnmatchedEditorialBooks(groups, editorialBookIndex) {
  const classifiedTitles = new Set(
    groups
      .filter((group) => group.groupType === "book")
      .map((group) => normalize(group.titleEn)),
  );
  return Object.values(editorialBookIndex)
    .flat()
    .filter((title) => !classifiedTitles.has(normalize(title)));
}

export function addPresentationReleaseMetadata(groups, englishNodes, spanishNodes, sourceUrl, records) {
  const releases = groups.filter((group) => group.groupType === "release");
  const byKey = new Map(releases.map((group) => [releaseKey(group.titleEn), group]));

  for (const [hash, node] of Object.entries(englishNodes)) {
    if (!node || node.redacted) continue;
    const titleEn = text(node.displayProperties?.name);
    const release = byKey.get(releaseKey(titleEn));
    if (!release) continue;

    const localized = spanishNodes[hash];
    release.titleEs ||= text(localized?.displayProperties?.name) || null;
    release.imageUrl ||= getBungieImageUrl(
      localized?.displayProperties?.icon || node.displayProperties?.icon,
    );
    release.sourceUrl ||= sourceUrl;
    release.loreHashes = [...new Set([
      ...release.loreHashes,
      ...getNodeLoreHashes(hash, englishNodes, records),
    ])];
  }
  return groups;
}
