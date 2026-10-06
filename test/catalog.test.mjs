import assert from "node:assert/strict";
import test from "node:test";
import {
  mapD1InventoryCatalog,
  mapD1NamedCatalog,
  mapInventoryCatalog,
  mapNamedCatalog,
} from "../scripts/catalog.mjs";

test("maps D2 weapons, armor, and narrative items with Spanish metadata and icons", () => {
  const records = mapInventoryCatalog(
    {
      101: {
        itemType: 3,
        inventory: { tierType: 4 },
        itemTypeName: "Auto Rifle",
        tierTypeName: "Legendary",
        screenshot: "/common/destiny2_content/screenshots/rifle-large.jpg",
        flavorText: "A weapon's remembered words.",
        displayProperties: { name: "Rifle", description: "English description." },
      },
      102: {
        itemType: 2,
        itemTypeName: "Helmet",
        tierTypeName: "Legendary",
        classType: 0,
        displayProperties: { name: "Helmet", description: "Armor description." },
      },
      103: {
        itemType: 20,
        loreDescription: "An old relic.",
        displayProperties: { name: "Relic" },
      },
      104: { itemType: 1, displayProperties: { name: "Currency" } },
    },
    {
      101: {
        itemType: 3,
        itemTypeName: "Fusil automático",
        tierTypeName: "Leyenda",
        flavorText: "Las palabras recordadas de un arma.",
        displayProperties: { name: "Fusil", description: "Descripción en español.", icon: "/common/destiny2_content/icons/rifle.png" },
      },
      102: {
        itemType: 2,
        itemTypeName: "Casco",
        tierTypeName: "Leyenda",
        classType: 0,
        displayProperties: { name: "Casco" },
      },
    },
    "destiny2",
    "https://www.bungie.net/common/items-es.json",
  );

  assert.deepEqual(records.map(({ category }) => category), ["weapons", "armor", "objects", "objects"]);
  assert.equal(records[0].titleEs, "Fusil");
  assert.equal(records[0].imageUrl, "https://www.bungie.net/common/destiny2_content/screenshots/rifle-large.jpg");
  assert.equal(records[0].imageKind, "artwork");
  assert.equal(records[0].titleEs, "Fusil");
  assert.equal(records[1].titleEs, "Casco");
  assert.equal(records[0].rarity, "Peculiar");
  assert.equal(records[0].classType, null);
  assert.equal(records[0].itemType, "Fusil automático");
  assert.equal(records[0].iconUrl, "https://www.bungie.net/common/destiny2_content/icons/rifle.png");
  assert.equal(records[1].classType, 0);
  assert.equal(records[0].classType, null);
  assert.equal(records[1].rarity, "Leyenda");
  assert.match(records[0].summaryEs, /Fusil automático/);
  assert.match(records[0].summaryEs, /Peculiar/);
  assert.match(records[1].summaryEs, /para Titán/);
  assert.equal(records[0].descriptionEn, "English description.");
  assert.equal(records[0].descriptionEs, "Descripción en español.");
  assert.equal(records[0].flavorTextEn, "A weapon's remembered words.");
  assert.equal(records[0].flavorTextEs, "Las palabras recordadas de un arma.");
  assert.equal(records[1].descriptionEn, "Armor description.");
  assert.equal(records[1].descriptionEs, null);
  assert.equal(records[2].descriptionEn, "An old relic.");
  assert.equal(records[2].descriptionEs, null);
  assert.equal(records[3].descriptionEn, null);
  assert.equal(records[3].descriptionEs, null);
});

test("normalizes D2 rarity from the official tier type and deduplicates identical definitions", () => {
  const records = mapInventoryCatalog(
    {
      201: {
        itemType: 8,
        inventory: { tierType: 4 },
        itemTypeName: "Engram",
        displayProperties: { name: "Blue Engram", icon: "/common/destiny2_content/icons/engram.png" },
      },
      202: {
        itemType: 8,
        inventory: { tierType: 4 },
        itemTypeName: "Engram",
        displayProperties: { name: "Blue Engram", icon: "/common/destiny2_content/icons/engram.png" },
      },
      203: {
        itemType: 8,
        inventory: { tierType: 5 },
        itemTypeName: "Engram",
        displayProperties: { name: "Blue Engram", icon: "/common/destiny2_content/icons/engram.png" },
      },
    },
    {
      201: { inventory: { tierTypeName: "Poco común" }, displayProperties: { name: "Engrama azul" } },
      202: { inventory: { tierTypeName: "Poco común" }, displayProperties: { name: "Engrama azul" } },
      203: { inventory: { tierTypeName: "Leyenda" }, displayProperties: { name: "Engrama azul" } },
    },
    "destiny2",
    "https://www.bungie.net/items-es.json",
  );

  assert.equal(records.length, 2);
  assert.equal(records[0].rarity, "Peculiar");
  assert.equal(records[1].rarity, "Leyenda");
});

test("uses native-size fallback icons when no high-resolution catalog art exists", () => {
  const [record] = mapInventoryCatalog(
    {
      101: {
        itemType: 3,
        displayProperties: { name: "Rifle", icon: "/common/destiny2_content/icons/rifle.jpg" },
      },
    },
    {},
    "destiny2",
    "https://www.bungie.net/items-en.json",
  );
  assert.equal(record.imageKind, "icon");
});

test("maps D1 weapon/armor references and named characters without cross-table id collisions", () => {
  const items = mapD1InventoryCatalog({
    1: { itemHash: 1, itemType: 3, itemName: "Weapon", itemDescription: "English weapon description.", flavorText: "English weapon lore.", tierTypeName: "Exotic", itemTypeName: "Hand Cannon", icon: "/common/destiny_content/icons/weapon.png" },
    2: { itemHash: 2, itemType: 2, itemName: "Armor", itemDescription: "English armor description.", classType: 0, tierTypeName: "Legendary", itemTypeName: "Helmet" },
    3: { itemHash: 3, itemType: 1, itemName: "Material", itemDescription: "English material description." },
    4: { itemHash: 4, itemType: 1, itemName: "Rare Material", tierTypeName: "Rare" },
  }, {
    1: { itemName: "Arma", itemDescription: "Descripción española del arma.", flavorText: "Ambientación española del arma.", tierTypeName: "Excepcional", itemTypeName: "Cañón de mano" },
    2: { itemName: "Armadura", tierTypeName: "Leyenda", itemTypeName: "Casco" },
    3: { itemName: "Material" },
    4: { itemName: "Material raro", tierTypeName: "Raro" },
  }, "https://www.bungie.net/d1.content");
  const people = mapD1NamedCatalog({
    1: { raceName: "Human" },
  }, {
    1: { raceName: "Humano" },
  }, "species", "https://www.bungie.net/d1.content", "DestinyRaceDefinition");

  assert.deepEqual(items.map(({ category }) => category), ["weapons", "armor", "objects", "objects"]);
  assert.equal(items[0].imageUrl, "https://www.bungie.net/common/destiny_content/icons/weapon.png");
  assert.equal(items[0].imageKind, "icon");
  assert.equal(people[0].titleEs, "Humano");
  assert.equal(items[0].rarity, "Excepcional");
  assert.equal(items[0].itemType, "Cañón de mano");
  assert.equal(items[1].classType, 0);
  assert.equal(items[0].classType, null);
  assert.equal(items[1].rarity, "Leyenda");
  assert.equal(items[0].rarity, "Excepcional");
  assert.equal(items[0].descriptionEn, "English weapon description.");
  assert.equal(items[0].descriptionEs, "Descripción española del arma.");
  assert.equal(items[0].flavorTextEn, "English weapon lore.");
  assert.equal(items[0].flavorTextEs, "Ambientación española del arma.");
  assert.equal(items[1].descriptionEs, null);
  assert.equal(items[2].descriptionEn, "English material description.");
  assert.equal(items[2].descriptionEs, null);
  assert.equal(items[3].rarity, "Peculiar");
  assert.match(items[0].summaryEs, /Arma/);
  assert.match(people[0].summaryEs, /Pueblo o clase/);
  assert.notEqual(items[0].bungieId, people[0].bungieId);
});

test("maps character-style D2 definitions using their table-specific IDs", () => {
  const records = mapNamedCatalog(
    { 123: { displayProperties: { name: "Zavala", description: "Commander." } } },
    { 123: { displayProperties: { name: "Zavala", description: "Comandante." } } },
    "destiny2",
    "characters",
    "https://www.bungie.net/vendors-es.json",
    "DestinyVendorDefinition",
  );
  assert.equal(records[0].category, "characters");
  assert.equal(records[0].bungieId, "d2:DestinyVendorDefinition:123");
  assert.equal(records[0].titleEs, "Zavala");
  assert.equal(records[0].descriptionEn, "Commander.");
  assert.equal(records[0].descriptionEs, "Comandante.");
});

test("maps destination definitions as localized places for lore references", () => {
  const [record] = mapNamedCatalog(
    { 321: { destinationName: "The Reef", icon: "/common/destiny_content/icons/reef.png" } },
    { 321: { destinationName: "El Arrecife" } },
    "destiny1",
    "places",
    "https://www.bungie.net/d1.destinations",
    "DestinyDestinationDefinition",
  );

  assert.equal(record.category, "places");
  assert.equal(record.titleEn, "The Reef");
  assert.equal(record.titleEs, "El Arrecife");
  assert.equal(record.imageUrl, "https://www.bungie.net/common/destiny_content/icons/reef.png");
  assert.match(record.summaryEs, /Lugar del universo/);
});

test("extracts D1 vendor names and icons from the nested vendor summary", () => {
  const records = mapD1NamedCatalog({
    4: {
      summary: {
        vendorName: "Zavala",
        vendorIcon: "/common/destiny_content/icons/zavala.png",
      },
    },
  }, {
    4: {
      summary: {
        vendorName: "Zavala",
        vendorIcon: "/common/destiny_content/icons/zavala.png",
      },
    },
  }, "characters", "https://www.bungie.net/d1.content", "DestinyVendorDefinition");

  assert.equal(records[0].titleEn, "Zavala");
  assert.equal(records[0].imageUrl, "https://www.bungie.net/common/destiny_content/icons/zavala.png");
});
