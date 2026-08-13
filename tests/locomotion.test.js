import test from "node:test";
import assert from "node:assert/strict";
import { resolveHorizontalMovement } from "../src/core/locomotion.js";
import { FIGHTER_TUNING } from "../src/data/balance.js";

const knight = FIGHTER_TUNING.knight;

test("right-facing fighter can walk forward and backward", () => {
  assert.deepEqual(resolveHorizontalMovement({ inputAxis: 1, facing: 1, tuning: knight }), {
    direction: "forward",
    axis: 1,
    velocityX: knight.walkForward
  });
  assert.deepEqual(resolveHorizontalMovement({ inputAxis: -1, facing: 1, tuning: knight }), {
    direction: "backward",
    axis: -1,
    velocityX: -knight.walkBackward
  });
});

test("left-facing fighter can walk forward and backward", () => {
  assert.deepEqual(resolveHorizontalMovement({ inputAxis: -1, facing: -1, tuning: knight }), {
    direction: "forward",
    axis: -1,
    velocityX: -knight.walkForward
  });
  assert.deepEqual(resolveHorizontalMovement({ inputAxis: 1, facing: -1, tuning: knight }), {
    direction: "backward",
    axis: 1,
    velocityX: knight.walkBackward
  });
});

test("small joystick noise remains idle", () => {
  assert.deepEqual(resolveHorizontalMovement({ inputAxis: 0.1, facing: 1, tuning: knight }), {
    direction: "idle",
    axis: 0,
    velocityX: 0
  });
});
