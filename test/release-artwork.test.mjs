import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getReleaseArtwork, getReleaseDisplayTitle } from "../src/data/release-artwork.ts";

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const publicDirectory = join(projectDirectory, "public");
const releaseIndex = JSON.parse(readFileSync(join(projectDirectory, "data", "release-index.json"), "utf8"));

test("every Destiny 2 release has Bungie artwork assigned", () => {
  const releases = releaseIndex.filter((release) => release.sourceGame === "destiny2");
  for (const release of releases) {
    const artwork = getReleaseArtwork(release.slug);
    assert.ok(artwork, `${release.slug} has no artwork`);
    assert.match(artwork.credit, /BUNGIE/, `${release.slug} artwork is not credited to Bungie`);
    assert.doesNotMatch(artwork.credit, /LOCAL/i, `${release.slug} artwork should not be described as local`);
    const assetPath = decodeURIComponent(artwork.src.replace(/^\//, ""));
    assert.ok(existsSync(join(publicDirectory, assetPath)), `${release.slug} artwork is missing: ${assetPath}`);
  }
});

test("Renegades is titled Los Desertores in Spanish launch listings", () => {
  const renegades = releaseIndex.find((release) => release.slug === "renegades");
  assert.equal(renegades?.titleEs, "Los Desertores");
  assert.equal(getReleaseDisplayTitle("renegades", "Renegades"), "Los Desertores");
  assert.equal(getReleaseDisplayTitle("forsaken", "Los Renegados"), "Los Renegados");
});
