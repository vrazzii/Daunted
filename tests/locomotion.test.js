import test from "node:test";
import assert from "node:assert/strict";
import { resolveHorizontalMovement } from "../src/core/locomotion.js";
import { FIGHTER_TUNING } from "../src/data/balance.js";

const knight = FIGHTER_TUNING.knight;

test("right-facing fighter can walk forward and backward", () => {
  assert.equal(resolveHorizontalMovement({ inputAxis: 1, facing: 1, tuning: knight }).direction, "forward");
  const backward = resolveHorizontalMovement({ inputAxis: -1, facing: 1, tuning: knight });
  assert.equal(backward.direction, "backward");
  assert.equal(backward.velocityX, -knight.walkBackward);
});

test("left-facing fighter can walk forward and backward", () => {
  assert.equal(resolveHorizontalMovement({ inputAxis: -1, facing: -1, tuning: knight }).direction, "forward");
  const backward = resolveHorizontalMovement({ inputAxis: 1, facing: -1, tuning: knight });
  assert.equal(backward.direction, "backward");
  assert.equal(backward.velocityX, knight.walkBackward);
});

test("joystick dead-zone noise does not move the fighter", () => {
  assert.deepEqual(resolveHorizontalMovement({ inputAxis: 0.1, facing: 1, tuning: knight }), {
    direction: "idle",
    axis: 0,
    velocityX: 0
  });
});
