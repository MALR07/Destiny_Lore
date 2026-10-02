import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  addPresentationReleaseMetadata,
  findUnmatchedD1EditorialBooks,
  findUnmatchedEditorialBooks,
  mapD1EditorialBooks,
  mapLoreGroups,
  mergeKnownReleases,
} from "../scripts/lore-groups.mjs";

const sourceUrls = {
  presentation: "https://bungie.net/presentation-es.json",
  seasons: "https://bungie.net/seasons-es.json",
  records: "https://bungie.net/records-en.json",
};

const englishNodes = {
  10: {
    displayProperties: { name: "Lore Archive" },
    children: { presentationNodes: [{ presentationNodeHash: 20 }, { presentationNodeHash: 30 }] },
  },
  20: {
    displayProperties: { name: "The Book of Dawn" },
    parentNodeHashes: [10],
    children: { records: [{ recordHash: 501 }, { recordHash: 502 }] },
  },
  30: {
    displayProperties: { name: "Season of Dawn" },
    children: { presentationNodes: [{ presentationNodeHash: 40 }] },
  },
  40: {
    displayProperties: { name: "Season collection" },
    parentNodeHashes: [30],
    children: { records: [{ recordHash: 503 }] },
  },
};

const englishRecords = {
  501: { loreHash: 101 },
  502: { loreHash: 102 },
  503: { loreHash: 103 },
  504: { loreHash: 0 },
};

const knownReleases = [
  {
    slug: "season-of-dawn",
    title: "Season of Dawn",
    titleEs: "Temporada del Alba",
    sourceGame: "destiny2",
    releaseOrder: 1,
  },
  {
    slug: "destiny",
    title: "Destiny",
    titleEs: "Destiny",
    sourceGame: "destiny1",
    releaseOrder: 2,
  },
];

function mapSample() {
  return mapLoreGroups(
    englishNodes,
    {
      10: { displayProperties: { name: "Archivo de historia" } },
      20: { displayProperties: { name: "El libro del Alba" } },
      30: { displayProperties: { name: "Temporada del Alba" } },
    },
    {
      300: {
        seasonNumber: 9,
        displayProperties: { name: "Season of Dawn", icon: "/common/destiny2/season.png" },
      },
    },
    {
      300: {
        displayProperties: { name: "Temporada del Alba", icon: "/common/destiny2/season-es.png" },
      },
    },
    englishRecords,
    { "season-of-dawn": ["The Book of Dawn"] },
    knownReleases,
    sourceUrls,
  );
}

test("resolves presentation records to lore and classifies books by the local editorial index", () => {
  const groups = mapSample();
  const book = groups.find((group) => group.bungieId === "20");
  const unclassified = groups.find((group) => group.bungieId === "40");

  assert.deepEqual(
    { groupType: book.groupType, titleEs: book.titleEs, releaseSlug: book.releaseSlug, loreHashes: book.loreHashes },
    { groupType: "book", titleEs: "El libro del Alba", releaseSlug: "season-of-dawn", loreHashes: ["101", "102"] },
  );
  assert.deepEqual(
    { groupType: unclassified.groupType, loreHashes: unclassified.loreHashes },
    { groupType: "category", loreHashes: ["103"] },
  );
  assert.ok(groups.some((group) => group.groupType === "category" && group.bungieId === "10"));
  assert.ok(groups.every((group) => !group.loreHashes.includes("0")));
});

test("adds Bungie season art, localization, and record-linked lore", () => {
  const groups = mapSample();
  addPresentationReleaseMetadata(
    groups,
    {
      300: {
        displayProperties: { name: "Season of Dawn", icon: "/common/destiny2/season.png" },
        children: { records: [{ recordHash: 503 }] },
      },
    },
    {
      300: {
        displayProperties: { name: "Temporada del Alba", icon: "/common/destiny2/season-es.png" },
      },
    },
    sourceUrls.presentation,
    englishRecords,
  );
  const season = groups.find((group) => group.groupType === "release");

  assert.equal(season.titleEs, "Temporada del Alba");
  assert.equal(season.imageUrl, "https://www.bungie.net/common/destiny2/season-es.png");
  assert.equal(season.sourceUrl, sourceUrls.seasons);
  assert.ok(season.loreHashes.includes("103"));
});

test("merges locally classified books into the matching release without losing Bungie links", () => {
  const groups = mergeKnownReleases([
    ...mapSample(),
    {
      groupType: "release",
      sourceGame: "destiny2",
      bungieId: "301",
      titleEn: "Season of an Unlisted Release",
      titleEs: "Temporada no indexada",
      loreHashes: ["104"],
    },
  ], knownReleases);
  const season = groups.find((group) => group.groupType === "release" && group.releaseSlug === "season-of-dawn");
  const destiny = groups.find((group) => group.groupType === "release" && group.releaseSlug === "destiny");
  const releases = groups.filter((group) => group.groupType === "release");

  assert.equal(season.titleEs, "Temporada del Alba");
  assert.equal(season.releaseOrder, 1);
  assert.deepEqual(season.loreHashes, ["103", "101", "102"]);
  assert.equal(destiny.bungieId, "local:destiny");
  assert.equal(destiny.sourceGame, "destiny1");
  assert.deepEqual(destiny.loreHashes, []);
  assert.equal(releases.length, knownReleases.length);
  assert.ok(releases.every((release) => knownReleases.some(({ slug }) => slug === release.releaseSlug)));
});

test("rejects editorial mappings to a release that is not in the local release index", () => {
  assert.throws(
    () => mapLoreGroups({}, {}, {}, {}, {}, { missing: ["A Book"] }, [], sourceUrls),
    /lanzamiento desconocido "missing"/,
  );
});

test("reports editorial book titles that have no official lore node", () => {
  const groups = mapSample();
  assert.deepEqual(
    findUnmatchedEditorialBooks(groups, { "season-of-dawn": ["The Book of Dawn", "Missing Official Book"] }),
    ["Missing Official Book"],
  );
});

test("the editorial book map only references known releases and has unique titles", async () => {
  const [bookIndexText, releaseIndexText] = await Promise.all([
    readFile(new URL("../data/editorial-book-index.json", import.meta.url), "utf8"),
    readFile(new URL("../data/release-index.json", import.meta.url), "utf8"),
  ]);
  const bookIndex = JSON.parse(bookIndexText);
  const releaseIndex = JSON.parse(releaseIndexText);
  const releaseSlugs = new Set(releaseIndex.map(({ slug }) => slug));
  const bookTitles = Object.values(bookIndex).flat();
  const normalizeTitle = (title) => title.normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

  assert.ok(Object.keys(bookIndex).every((slug) => releaseSlugs.has(slug)));
  assert.equal(releaseIndex.length, 37);
  assert.equal(bookTitles.length, 110);
  assert.equal(bookTitles.length, new Set(bookTitles.map(normalizeTitle)).size);
});

test("maps official Destiny 1 card hashes into the Taken King and House of Wolves books", async () => {
  const [d1BookIndexText, releaseIndexText] = await Promise.all([
    readFile(new URL("../data/d1-editorial-book-index.json", import.meta.url), "utf8"),
    readFile(new URL("../data/release-index.json", import.meta.url), "utf8"),
  ]);
  const d1BookIndex = JSON.parse(d1BookIndexText);
  const releases = JSON.parse(releaseIndexText).map((release, index) => ({
    ...release,
    releaseOrder: index + 1,
  }));
  const cardTitles = Object.values(d1BookIndex).flat().flatMap((book) => book.cards);
  const d1LoreEntries = cardTitles.map((title, index) => ({
    bungieId: ({
      "I: Predators": "d1:700680",
      "L: Wormfood": "d1:701170",
      "WANTED: Skolas, Kell of Kells": "d1:688020",
      "WANTED: Weksis, the Meek": "d1:688130",
    })[title] ?? `d1:fixture-${index}`,
    titleEn: title,
  }));
  const books = mapD1EditorialBooks(d1BookIndex, releases, d1LoreEntries);
  const booksOfSorrow = books.find((book) => book.bungieId === "d1-book:books-of-sorrow");
  const maraid = books.find((book) => book.bungieId === "d1-book:the-maraid");

  assert.equal(books.length, 2);
  assert.deepEqual(
    { sourceGame: booksOfSorrow.sourceGame, releaseSlug: booksOfSorrow.releaseSlug, releaseOrder: booksOfSorrow.releaseOrder },
    { sourceGame: "destiny1", releaseSlug: "the-taken-king", releaseOrder: 34 },
  );
  assert.equal(booksOfSorrow.titleEs, "Libros del pesar");
  assert.equal(booksOfSorrow.loreHashes.length, 52);
  assert.ok(booksOfSorrow.loreHashes.includes("d1:700680"));
  assert.ok(booksOfSorrow.loreHashes.includes("d1:701170"));
  assert.deepEqual(
    { sourceGame: maraid.sourceGame, releaseSlug: maraid.releaseSlug, loreCount: maraid.loreHashes.length },
    { sourceGame: "destiny1", releaseSlug: "house-of-wolves", loreCount: 12 },
  );
  assert.equal(maraid.titleEs, "La incursión de Mara");
  assert.ok(maraid.loreHashes.includes("d1:688020"));
  assert.ok(maraid.loreHashes.includes("d1:688130"));
  assert.ok(maraid.loreHashes.includes(
    d1LoreEntries.find(({ titleEn }) => titleEn === "WANTED: Skoriks, Archon-Slayer").bungieId,
  ));
  assert.deepEqual(findUnmatchedD1EditorialBooks(d1BookIndex, d1LoreEntries), []);
});
