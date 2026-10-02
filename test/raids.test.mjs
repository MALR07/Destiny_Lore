import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { raids } from "../src/data/raids.ts";

const releaseIndex = JSON.parse(await readFile(new URL("../data/release-index.json", import.meta.url), "utf8"));
const knownReleaseSlugs = new Set(releaseIndex.map((release) => release.slug));

test("raid detail data has unique IDs and links to known game releases", () => {
  assert.equal(new Set(raids.map((raid) => raid.id)).size, raids.length);
  for (const raid of raids) {
    assert.ok(knownReleaseSlugs.has(raid.releaseSlug), `${raid.id} has an unknown release slug`);
    assert.ok(["destiny1", "destiny2"].includes(raid.game), `${raid.id} has an invalid game`);
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
