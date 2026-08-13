import test from "node:test";
import assert from "node:assert/strict";
import { movePhaseAt, totalMoveTicks, validateMoveDefinition } from "../src/core/move-schema.js";

const sampleMove = Object.freeze({
  id: "test-strike",
  animation: "standing-light",
  input: "light",
  startup: 5,
  active: 3,
  recovery: 9,
  damage: 50,
  hitstun: 12,
  blockstun: 8,
  hitstop: 5,
  hitboxes: Object.freeze([
    Object.freeze({
      from: 5,
      to: 7,
      box: Object.freeze({ x: 24, y: -110, width: 70, height: 42 })
    })
  ])
});

test("move timing contract validates a legal move", () => {
  assert.deepEqual(validateMoveDefinition(sampleMove), []);
  assert.equal(totalMoveTicks(sampleMove), 17);
});

test("move phases use simulation ticks rather than image count", () => {
  assert.equal(movePhaseAt(sampleMove, 0), "startup");
  assert.equal(movePhaseAt(sampleMove, 5), "active");
  assert.equal(movePhaseAt(sampleMove, 8), "recovery");
  assert.equal(movePhaseAt(sampleMove, 17), "complete");
});
