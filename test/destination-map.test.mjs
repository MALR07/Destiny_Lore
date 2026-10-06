import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  DESTINY2_MAP_LOCATIONS,
  getDestinationArtworkUrl,
  getDestinationLore,
  getDestiny2MapLocation,
} from "../src/data/destination-artwork.ts";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const destiny2ArtworkDirectory = join(publicDirectory, "media", "site-art", "destinos", "destiny2");

test("Destiny 2 destinations have unique IDs, descriptions and map positions only when shown", () => {
  assert.ok(DESTINY2_MAP_LOCATIONS.length >= 20);
  assert.equal(DESTINY2_MAP_LOCATIONS.filter((location) => location.showOnMap).length, 13);
  assert.equal(new Set(DESTINY2_MAP_LOCATIONS.map((location) => location.id)).size, DESTINY2_MAP_LOCATIONS.length);
  for (const location of DESTINY2_MAP_LOCATIONS) {
    assert.ok(location.title.trim(), `${location.id} has no display name`);
    assert.ok(location.summary.trim(), `${location.id} has no summary`);
    assert.ok(location.era === "actual" || location.era === "legado", `${location.id} has an invalid era`);
    if (location.showOnMap) {
      assert.ok(location.left !== null && location.left > 0 && location.left < 100, `${location.id} has an invalid horizontal coordinate`);
      assert.ok(location.top !== null && location.top > 0 && location.top < 100, `${location.id} has an invalid vertical coordinate`);
      assert.equal(location.era, "actual", `${location.id} should not place a legacy destination on the current map`);
    } else {
      assert.equal(location.left, null, `${location.id} must not have a fabricated horizontal coordinate`);
      assert.equal(location.top, null, `${location.id} must not have a fabricated vertical coordinate`);
    }
    for (const alias of location.aliases) {
      assert.equal(getDestiny2MapLocation(alias)?.id, location.id, `${location.id} does not resolve alias ${alias}`);
    }
    if (location.artworkUrl) {
      const assetPath = decodeURIComponent(location.artworkUrl.replace(/^\/media\//, ""));
      assert.ok(existsSync(join(publicDirectory, "media", assetPath)), `${location.id} artwork is missing: ${assetPath}`);
    }
  }
});

test("Destiny 2 map locations resolve their English and Spanish names", () => {
  assert.equal(getDestiny2MapLocation("Savathûn's Throne World")?.id, "throne-world");
  assert.equal(getDestiny2MapLocation("Neomuna")?.id, "neomuna");
  assert.equal(getDestiny2MapLocation("The Pale Heart")?.id, "pale-heart");
  assert.equal(getDestiny2MapLocation("Kepler")?.id, "kepler");
  assert.equal(getDestiny2MapLocation("Lawless Frontier")?.id, "lawless-frontier");
  assert.equal(getDestiny2MapLocation("mission briefing")?.id, undefined);
});

test("legacy Reef stays off the map and displays its local artwork", () => {
  const reef = DESTINY2_MAP_LOCATIONS.find((location) => location.id === "reef");
  assert.ok(reef);
  assert.equal(reef.showOnMap, false);
  assert.equal(reef.artworkUrl, "/media/site-art/destinos/destiny1/Destiny-Reef-Social-Space-Dock.avif");
});

test("new destination artwork is assigned to Lawless Frontier and Mercury", () => {
  assert.equal(
    DESTINY2_MAP_LOCATIONS.find((location) => location.id === "lawless-frontier")?.artworkUrl,
    "/media/site-art/destinos/destiny2/sin%20ley.jpg",
  );
  assert.equal(
    DESTINY2_MAP_LOCATIONS.find((location) => location.id === "mercury")?.artworkUrl,
    "/media/site-art/destinos/destiny2/mercurio.webp",
  );
});

test("Destiny 2 catalog entries resolve local artwork and Spanish destination context", () => {
  const entry = {
    sourceGame: "destiny2",
    category: "places",
    title: "Europa",
    titleEn: "Europa",
  };
  assert.equal(getDestinationArtworkUrl(entry), "/media/site-art/destinos/destiny2/europa.jpg");
  assert.match(getDestinationLore(entry)?.summary ?? "", /luna helada/i);
  assert.equal(getDestinationLore({ ...entry, title: "Crucible", titleEn: "Crucible" }), null);
});

test("the supplied Destiny 2 map asset exists", () => {
  assert.ok(existsSync(join(destiny2ArtworkDirectory, "d2 mapa.jpg")));
});
