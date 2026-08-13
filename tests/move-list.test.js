import test from "node:test";
import assert from "node:assert/strict";
import { FIGHTERS } from "../src/data/fighters.js";
import { FIGHTER_MOVE_LISTS, UNIVERSAL_MOVES, validateMoveLists } from "../src/data/move-list.js";

test("every fighter has a complete command list", () => {
  assert.deepEqual(validateMoveLists(), []);
  for (const fighter of FIGHTERS) {
    assert.ok(FIGHTER_MOVE_LISTS[fighter.id]);
    assert.ok(FIGHTER_MOVE_LISTS[fighter.id].moves.length >= 6);
  }
});

test("essential universal tools stay directly accessible", () => {
  const inputs = UNIVERSAL_MOVES.map(move => move.input);
  assert.ok(inputs.includes("L"));
  assert.ok(inputs.includes("H"));
  assert.ok(inputs.includes("Hold ←"));
  assert.ok(inputs.includes("L + H"));
});
