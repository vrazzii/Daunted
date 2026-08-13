import test from "node:test";
import assert from "node:assert/strict";
import {
  AnimationPlayer,
  expectedSheetSize,
  frameSourceRect,
  validateAnimationDefinition
} from "../src/core/animation.js";
import { ANIMATION_LIBRARY } from "../src/data/animations.js";

const idle = ANIMATION_LIBRARY.knight.idle;

test("every registered animation passes the manifest contract", () => {
  for (const animations of Object.values(ANIMATION_LIBRARY)) {
    for (const animation of Object.values(animations)) {
      assert.deepEqual(validateAnimationDefinition(animation), []);
    }
  }
});

test("idle sheet dimensions are derived from its uniform grid", () => {
  assert.deepEqual(expectedSheetSize(idle), { width: 1448, height: 1086 });
});

test("logical frame maps to the correct source cell", () => {
  assert.deepEqual(frameSourceRect(idle, 5), {
    x: 362,
    y: 362,
    width: 362,
    height: 362,
    logicalFrame: 5,
    sheetFrame: 5
  });
});

test("animation timing is independent from art frame count", () => {
  const player = new AnimationPlayer(idle);
  player.updateTicks(idle.ticksPerFrame - 1);
  assert.equal(player.frameIndex, 0);
  player.updateTicks(1);
  assert.equal(player.frameIndex, 1);
});

test("looping animation returns to frame zero", () => {
  const player = new AnimationPlayer(idle);
  player.seek(idle.frameCount - 1);
  player.updateTicks(idle.ticksPerFrame);
  assert.equal(player.frameIndex, 0);
});

test("manual stepping pauses playback and wraps", () => {
  const player = new AnimationPlayer(idle);
  player.step(-1);
  assert.equal(player.playing, false);
  assert.equal(player.frameIndex, idle.frameCount - 1);
});

test("playback rate changes presentation without changing the manifest", () => {
  const player = new AnimationPlayer(idle);
  player.setPlaybackRate(2);
  player.updateTicks(idle.ticksPerFrame / 2);
  assert.equal(player.frameIndex, 1);
  assert.equal(idle.ticksPerFrame, 6);
});

test("Wolf uses the authoritative variable frame timing", () => {
  const wolfIdle = ANIMATION_LIBRARY.wolf.idle;
  const player = new AnimationPlayer(wolfIdle);
  player.seek(1);
  player.updateTicks(4);
  assert.equal(player.frameIndex, 1);
  player.updateTicks(1);
  assert.equal(player.frameIndex, 2);
  assert.equal(wolfIdle.frameTicks.reduce((sum, ticks) => sum + ticks, 0), 70);
});

test("source manifest offsets are retained for grounded alignment", () => {
  const saintIdle = ANIMATION_LIBRARY["veiled-saint"].idle;
  const player = new AnimationPlayer(saintIdle);
  player.seek(8);
  assert.deepEqual(player.snapshot().frameOffset, { x: 0, y: 21 });
});
