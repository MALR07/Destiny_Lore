import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [releaseIndex, itemIndex] = await Promise.all([
  readFile(new URL("../data/release-index.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/release-item-index.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("maps only Bungie inventory items to the 42 editorial releases", () => {
  const releasesBySlug = new Map(releaseIndex.map((release) => [release.slug, release]));
  const total = Object.values(itemIndex).reduce((sum, items) => sum + items.length, 0);

  assert.equal(releaseIndex.length, 42);
  assert.deepEqual(Object.keys(itemIndex).sort(), [...releasesBySlug.keys()].sort());
  assert.ok(total > 0);

  for (const [releaseSlug, items] of Object.entries(itemIndex)) {
    const release = releasesBySlug.get(releaseSlug);
    const seen = new Set();
    for (const item of items) {
      assert.equal(item.sourceGame, release.sourceGame);
      assert.ok(item.titleEn.trim());
      assert.ok(item.iconUrl == null || /^https:\/\/www\.bungie\.net\/(?:common|img)\//.test(item.iconUrl));
      assert.ok(["weapons", "armor", "objects"].includes(item.category));
      assert.match(item.ishtarItemSlug, /^[a-z0-9-]+$/);
      assert.ok(item.classType == null || [0, 1, 2, 3].includes(item.classType));
      assert.ok(item.rarity == null || typeof item.rarity === "string");
      assert.ok(item.itemType == null || typeof item.itemType === "string");
      const key = [
        item.category,
        item.titleEn,
        item.iconUrl,
        item.classType ?? "",
        item.rarity ?? "",
        item.itemType ?? "",
      ].join(":");
      assert.ok(!seen.has(key), `${releaseSlug} repeats ${item.titleEn}`);
      seen.add(key);
    }
  }

  assert.ok(itemIndex["season-of-the-hunt"].some((item) => item.titleEn === "Wild Hunt Cloak"));
  assert.ok(itemIndex["season-of-the-undying"].some((item) => item.titleEn === "Pluperfect"));
  assert.ok(itemIndex["season-of-the-risen"].some((item) => item.titleEn === "Tusked Allegiance Cloak"));
  assert.ok(itemIndex["season-of-defiance"].some((item) => item.titleEn === "Season of Defiance"));
  assert.ok(itemIndex["episode-echoes"].some((item) => item.titleEn === "The Call"));
  for (const slug of [
    "season-of-the-hunt",
    "season-of-the-undying",
    "season-of-the-risen",
    "season-of-defiance",
    "episode-echoes",
    "revenant",
    "heresy",
  ]) {
    assert.equal(releasesBySlug.get(slug)?.sourceGame, "destiny2", `${slug} is missing from the Destiny 2 release index`);
    assert.ok(itemIndex[slug], `${slug} is missing its launch item index`);
  }
});
