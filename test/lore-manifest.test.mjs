import assert from "node:assert/strict";
import test from "node:test";
import {
  getBungieImageUrl,
  getD1LocalizedWorldPath,
  getLocalizedLorePath,
  mapLoreDefinitions,
} from "../scripts/lore-manifest.mjs";

test("reads the Spanish world database path from the legacy Destiny manifest", () => {
  const manifest = {
    ErrorCode: 1,
    Message: "Ok",
    Response: {
      version: "legacy-version",
      mobileWorldContentPaths: {
        en: "/common/destiny_content/sqlite/en/world.content",
        es: "/common/destiny_content/sqlite/es/world.content",
      },
    },
  };

  assert.equal(
    getD1LocalizedWorldPath(manifest, "es"),
    "/common/destiny_content/sqlite/es/world.content",
  );
});

test("rejects missing and unsuccessful Destiny 1 manifest responses", () => {
  assert.throws(() => getD1LocalizedWorldPath({ ErrorCode: 1 }, "es"), /no ofrece datos/i);
  assert.throws(
    () => getD1LocalizedWorldPath({ ErrorCode: 2102, Message: "API key missing" }, "es"),
    /Bungie rechazó el manifiesto de Destiny 1: API key missing/,
  );
});

test("reads the localized lore path from the current Bungie manifest", () => {
  const manifest = {
    ErrorCode: 1,
    Message: "Ok",
    Response: {
      jsonWorldComponentContentPaths: {
        en: { DestinyLoreDefinition: "/common/destiny2_content/json/en/lore.json" },
        es: { DestinyLoreDefinition: "/common/destiny2_content/json/es/lore.json" },
      },
    },
  };

  assert.equal(
    getLocalizedLorePath(manifest, "es"),
    "/common/destiny2_content/json/es/lore.json",
  );
});

test("rejects missing and unsuccessful Bungie manifest responses", () => {
  assert.throws(() => getLocalizedLorePath({ ErrorCode: 1 }, "es"), /no ofrece/i);
  assert.throws(
    () => getLocalizedLorePath({ ErrorCode: 5, Message: "Unavailable" }, "es"),
    /Bungie rechazó el manifiesto: Unavailable/,
  );
});

test("maps English lore with its official Spanish localization", () => {
  const records = mapLoreDefinitions(
    {
      101: {
        displayProperties: {
          name: "The Last City",
          description: "A refuge beneath the Traveler&#8217;s Light.",
          icon: "/common/destiny2_content/icons/city.png",
        },
      },
      102: {
        displayProperties: { name: "Untranslated", description: "English source text." },
      },
      103: {
        displayProperties: { name: "No text", description: "  " },
      },
      104: {
        redacted: true,
        displayProperties: { name: "Hidden", description: "Do not import." },
      },
    },
    {
      101: {
        displayProperties: { name: "La Última Ciudad", description: "Un refugio bajo el Viajero." },
        subtitle: "La humanidad resiste",
      },
    },
  );

  assert.deepEqual(records, [
    {
      bungieId: "101",
      imageUrl: "https://www.bungie.net/common/destiny2_content/icons/city.png",
      imageKind: "icon",
      titleEn: "The Last City",
      titleEs: "La Última Ciudad",
      subtitleEs: "La humanidad resiste",
      contentEn: "A refuge beneath the Traveler’s Light.",
      contentEs: "Un refugio bajo el Viajero.",
    },
    {
      bungieId: "102",
      imageUrl: null,
      imageKind: null,
      titleEn: "Untranslated",
      titleEs: null,
      subtitleEs: null,
      contentEn: "English source text.",
      contentEs: null,
    },
  ]);
});

test("maps localized official Bungie artwork paths", () => {
  assert.equal(
    getBungieImageUrl("/common/destiny2_content/icons/lore.png"),
    "https://www.bungie.net/common/destiny2_content/icons/lore.png",
  );
  assert.equal(getBungieImageUrl("https://example.com/image.png"), null);
});

test("omits lore definitions with no usable title or source text", () => {
  const records = mapLoreDefinitions(
    {
      201: { displayProperties: { name: "", description: "Text without a title." } },
      202: { displayProperties: { name: "Title without text", description: "" } },
    },
    {},
  );

  assert.deepEqual(records, []);
});
