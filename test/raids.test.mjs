import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getRaidArtwork } from "../src/data/raid-artwork.ts";
import { raids } from "../src/data/raids.ts";

const releaseIndex = JSON.parse(await readFile(new URL("../data/release-index.json", import.meta.url), "utf8"));
const knownReleaseSlugs = new Set(releaseIndex.map((release) => release.slug));

test("raid detail data has unique IDs and links to known game releases", () => {
  assert.equal(new Set(raids.map((raid) => raid.id)).size, raids.length);
  for (const raid of raids) {
    assert.ok(knownReleaseSlugs.has(raid.releaseSlug), `${raid.id} has an unknown release slug`);
    assert.ok(["destiny1", "destiny2"].includes(raid.game), `${raid.id} has an invalid game`);
    if (raid.completeRun) {
      assert.match(raid.completeRun.youtubeId, /^[\w-]{11}$/, `${raid.id} has an invalid video ID`);
      assert.ok(raid.completeRun.title.trim(), `${raid.id} has no complete-run title`);
      assert.ok(raid.completeRun.creator.trim(), `${raid.id} has no video creator`);
    }
  }
});

test("every raid has highlighted rewards and an encounter guide", () => {
  for (const raid of raids) {
    assert.ok(raid.rewards.length > 0, `${raid.id} has no reward information`);
    assert.ok(raid.encounters.length > 0, `${raid.id} has no encounter guide`);
    for (const encounter of raid.encounters) {
      assert.ok(encounter.name.trim(), `${raid.id} has an unnamed encounter`);
      assert.ok(encounter.guide.trim(), `${raid.id} has an empty encounter guide`);
    }
  }
});

test("every raid links to a verified full-run video", () => {
  const videoIds = raids.map((raid) => raid.completeRun?.youtubeId);
  assert.ok(videoIds.every(Boolean), "Every raid needs a complete-run video");
  assert.equal(new Set(videoIds).size, raids.length, "Each raid should have its own video");
});

test("Destiny 1 raids use attributed local artwork", async () => {
  for (const raid of raids.filter((item) => item.game === "destiny1")) {
    const artwork = getRaidArtwork(raid.id);
    assert.ok(artwork, `${raid.id} has no artwork`);
    assert.ok(artwork.sourceUrl.startsWith("https://"), `${raid.id} has no source link`);
    assert.match(artwork.credit, /BUNGIE/, `${raid.id} is missing its Bungie credit`);
    await readFile(new URL(`../public${artwork.src}`, import.meta.url));
  }
});

test("all Destiny 2 raids use attributed local artwork", async () => {
  const destiny2Raids = raids.filter((item) => item.game === "destiny2");
  assert.equal(destiny2Raids.length, 15);
  for (const raid of destiny2Raids) {
    const artwork = getRaidArtwork(raid.id);
    assert.ok(artwork, `${raid.id} has no artwork`);
    assert.ok(artwork.sourceUrl.startsWith("https://"), `${raid.id} has no source link`);
    assert.match(artwork.credit, /BUNGIE/, `${raid.id} is missing its Bungie credit`);
    const image = await readFile(new URL(`../public${artwork.src}`, import.meta.url));
    assert.ok(image.length > 0, `${raid.id} has an empty image file`);
  }
});

test("Destiny 1 stellar map uses a local official chart image", async () => {
  await readFile(new URL("../public/media/site-art/mapas/destiny1/solar-system-map.jpg", import.meta.url));
});
