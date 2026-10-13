import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getReleaseArtwork, getReleaseDisplayTitle } from "../src/data/release-artwork.ts";
import { getReleaseIconUrl } from "../src/lib/release-icons.ts";

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

test("the recent Destiny 2 episodes are shown as episodes in launch listings", () => {
  const heresy = releaseIndex.find((release) => release.slug === "heresy");
  const revenant = releaseIndex.find((release) => release.slug === "revenant");
  const echoes = releaseIndex.find((release) => release.slug === "episode-echoes");

  assert.equal(heresy?.title, "Episode: Heresy");
  assert.equal(heresy?.titleEs, "Episodio: Herejía");
  assert.equal(revenant?.title, "Episode: Revenant");
  assert.equal(revenant?.titleEs, "Episodio: Resurgimiento");
  assert.equal(getReleaseDisplayTitle("heresy", "Episodio: Herejía"), "Episodio: Herejía");
  assert.equal(getReleaseDisplayTitle("revenant", "Episodio: Resurgimiento"), "Episodio: Resurgimiento");
  assert.equal(echoes?.titleEs, "Episodio: Ecos");
});

test("the Destiny 2 chronology places seasons and episodes after their expansion", () => {
  const chronologicalReleases = [...releaseIndex].reverse();
  const position = (slug) => chronologicalReleases.findIndex((release) => release.slug === slug);

  assert.ok(position("the-final-shape") < position("episode-echoes"));
  assert.ok(position("beyond-light") < position("season-of-the-hunt"));
  assert.ok(position("shadowkeep") < position("season-of-the-undying"));
});

test("release cards only show icons that exist locally", () => {
  for (const release of releaseIndex) {
    const iconUrl = getReleaseIconUrl(release.slug);
    if (!iconUrl) continue;
    const assetPath = decodeURIComponent(iconUrl.replace(/^\//, ""));
    assert.ok(existsSync(join(publicDirectory, assetPath)), `${release.slug} has no icon asset: ${assetPath}`);
  }

  assert.equal(getReleaseIconUrl("episode-echoes"), null);
  assert.equal(getReleaseIconUrl("season-of-the-hunt"), null);
  assert.equal(getReleaseIconUrl("season-of-the-undying"), null);
});
