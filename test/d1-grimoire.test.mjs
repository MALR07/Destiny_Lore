import test from "node:test";
import assert from "node:assert/strict";
import { zipSync } from "fflate";
import {
  findSqlitePayload,
  mapD1GrimoireDefinitions,
  removeDuplicateLore,
} from "../scripts/d1-grimoire.mjs";

test("finds the SQLite payload inside Bungie's nested ZIP content", () => {
  const sqlite = new Uint8Array([
    ...new TextEncoder().encode("SQLite format 3\0"),
    0x00,
    0x01,
  ]);
  const innerArchive = zipSync({ "world.content": sqlite });
  const outerArchive = zipSync({ "localized-world.zip": innerArchive });

  assert.deepEqual(findSqlitePayload(outerArchive), sqlite);
});

test("rejects content that is not a SQLite database or ZIP", () => {
  assert.throws(
    () => findSqlitePayload(new Uint8Array([1, 2, 3])),
    /no contiene una base SQLite reconocible/,
  );
});

test("maps D1 cards to isolated IDs and preserves Bungie's Spanish localization", () => {
  const records = mapD1GrimoireDefinitions(
    {
      "42": {
        cardName: "The Traveler",
        cardIntro: "A short introduction.",
        cardDescription: "<b>Verse 5:6 — Aiat, aiat, aiat, aiat, aiat</b>\n\n<p>The English account with munici&#243;n.</p>",
        unlockHowToText: "Do not include this unlock instruction in the lore text.",
        highResolution: { image: { sheetPath: "/common/destiny_content/grimoire/hr_images/42.jpg" } },
      },
      "43": { cardName: "Untranslated card", cardDescription: "English only." },
      "44": null,
    },
    {
      "42": {
        cardName: "El Viajero",
        cardIntro: "Una introducción breve.",
        cardDescription: "<b>Versículo 5:6 - Aiat, aiat, aiat, aiat, aiat</b>\n\n<p>El relato oficial con munici&#243;n.</p>",
        unlockHowToText: "No incluyas esta instrucción en el lore.",
        cardIntroAttribution: "Una fuente.",
        highResolution: { image: { sheetPath: "/common/destiny_content/grimoire/hr_images/42.jpg" } },
      },
    },
  );

  assert.deepEqual(records, [
    {
      bungieId: "d1:42",
      imageUrl: "https://www.bungie.net/common/destiny_content/grimoire/hr_images/42.jpg",
      imageKind: "artwork",
      titleEn: "The Traveler",
      titleEs: "El Viajero",
      subtitleEs: "Una fuente.",
      contentEn: "A short introduction.\n\nThe English account with munición.",
      contentEs: "Una introducción breve.\n\nEl relato oficial con munición.",
    },
    {
      bungieId: "d1:43",
      imageUrl: null,
      imageKind: null,
      titleEn: "Untranslated card",
      titleEs: null,
      subtitleEs: null,
      contentEn: "English only.",
      contentEs: null,
    },
  ]);
});

test("skips entries that do not have a displayable title", () => {
  assert.deepEqual(
    mapD1GrimoireDefinitions({ "5": { cardDescription: "No title" } }, {}),
    [],
  );
});

test("removes D1 lore duplicated with D2 or repeated within D1", () => {
  const records = [
    { bungieId: "d1:1", titleEn: "Crota", titleEs: "Crota", contentEn: "The same story.", contentEs: "La misma historia." },
    { bungieId: "d1:2", titleEn: "Crota", titleEs: "Crota", contentEn: "The same story.", contentEs: "La misma historia." },
    { bungieId: "d1:3", titleEn: "Oryx", titleEs: "Oryx", contentEn: "A different story.", contentEs: "Una historia distinta." },
  ];
  const existingD2 = [
    { titleEn: "Crota", titleEs: "Crota", contentEn: "The same story.", contentEs: "La misma historia." },
  ];

  assert.deepEqual(removeDuplicateLore(records, existingD2), [records[2]]);
});
