import assert from "node:assert/strict";
import test from "node:test";
import { replaceLoreGroups } from "../scripts/lore-group-store.mjs";

test("persists each group release slug and its official lore relations", async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes("INSERT INTO lore_groups")) {
        return { rows: [{ id: "12", groupType: "book", bungieId: "20" }] };
      }
      return { rows: [] };
    },
    release() {},
  };
  const pool = { async connect() { return client; } };

  await replaceLoreGroups(pool, [{
    sourceGame: "destiny2",
    groupType: "book",
    bungieId: "20",
    titleEn: "The Book of Dawn",
    titleEs: "El libro del Alba",
    imageUrl: null,
    sourceUrl: "https://bungie.net/presentation.json",
    releaseNumber: null,
    releaseOrder: 7,
    releaseSlug: "season-of-dawn",
    loreHashes: ["101", "102"],
  }]);

  const insert = calls.find(({ sql }) => sql.includes("INSERT INTO lore_groups"));
  const relations = calls.find(({ sql }) => sql.includes("INSERT INTO lore_group_entries"));

  assert.match(insert.sql, /release_order, release_slug/);
  assert.equal(insert.values[9], "season-of-dawn");
  assert.deepEqual(relations.values, [["12", "12"], ["101", "102"], [0, 1]]);
  assert.doesNotMatch(relations.sql, /e\.source_game\s*=/);
  assert.ok(calls.some(({ sql }) => sql === "COMMIT"));
});
