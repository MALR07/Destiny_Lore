import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mediaEntries } from "../src/data/media.ts";

const releaseIndex = JSON.parse(await readFile(new URL("../data/release-index.json", import.meta.url), "utf8"));
const knownReleaseSlugs = new Set(releaseIndex.map((release) => release.slug));

test("media entries have unique IDs and valid YouTube links", () => {
  assert.equal(new Set(mediaEntries.map((entry) => entry.id)).size, mediaEntries.length);
  for (const entry of mediaEntries) {
    assert.equal(entry.kind, "video");
    assert.ok(
      /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(entry.url)
        || /^\/media\/[a-z0-9/_-]+\.(?:m4v|mp4|ogv|ogg|webm)$/i.test(entry.url),
      `${entry.id} has an unsupported video URL`,
    );
    assert.ok(entry.title.trim(), `${entry.id} has no title`);
    assert.ok(entry.description?.trim(), `${entry.id} has no description`);
  }
});

test("media videos are associated with known releases and languages", () => {
  for (const entry of mediaEntries) {
    assert.ok(knownReleaseSlugs.has(entry.releaseSlug), `${entry.id} has an unknown release slug`);
    assert.ok(entry.language === undefined || entry.language === "es" || entry.language === "en", `${entry.id} has an invalid language`);
  }
});
