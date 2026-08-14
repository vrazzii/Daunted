import test from "node:test";
import assert from "node:assert/strict";
import {
  AnimationPlayer,
  expectedSheetSize,
  frameDestinationRect,
  frameRenderOffset,
  frameSourceRect,
  presentationGeometry,
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

test("non-divisible sheets partition only on integer pixel boundaries", () => {
  const odd = ANIMATION_LIBRARY.knight["crouching-light"];
  const cells = Array.from({ length: odd.frameCount }, (_, frame) => frameSourceRect(odd, frame));
  assert.ok(cells.every(cell => Number.isInteger(cell.x) && Number.isInteger(cell.y)));
  assert.ok(cells.every(cell => Number.isInteger(cell.width) && Number.isInteger(cell.height)));
  assert.equal(Math.max(...cells.map(cell => cell.width)), 373);
  assert.equal(Math.min(...cells.map(cell => cell.width)), 372);
  assert.equal(Math.max(...cells.map(cell => cell.height)), 528);
  assert.equal(Math.min(...cells.map(cell => cell.height)), 527);
});

test("native source pixels are never rescaled by destination geometry", () => {
  for (const animations of Object.values(ANIMATION_LIBRARY)) {
    for (const animation of Object.values(animations)) {
      for (let frame = 0; frame < animation.frameCount; frame += 1) {
        const source = frameSourceRect(animation, frame);
        const destination = frameDestinationRect(animation, frame);
        assert.equal(destination.width, source.width);
        assert.equal(destination.height, source.height);
      }
    }
  }
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

test("every approved idle frame resolves through explicit ground correction", () => {
  for (const animations of Object.values(ANIMATION_LIBRARY)) {
    const animation = animations.idle;
    for (let frame = 0; frame < animation.frameCount; frame += 1) {
      const renderOffset = frameRenderOffset(animation, frame);
      assert.equal(renderOffset.x, -(animation.frameOffsets[frame]?.x ?? 0));
      assert.equal(renderOffset.y, -(animation.frameOffsets[frame]?.y ?? 0));
    }
  }
});

test("ground correction counteracts frame-specific sprite drift", () => {
  const corrected = {
    ...idle,
    frameOffsets: idle.frameOffsets.map((offset, index) =>
      index === 1 ? { x: 3, y: -2 } : offset
    )
  };
  assert.deepEqual(frameRenderOffset(corrected, 1), { x: -3, y: 2 });
});

test("presentation geometry reserves enough room for every frame offset", () => {
  const corrected = {
    ...idle,
    frameOffsets: idle.frameOffsets.map((offset, index) => {
      if (index === 1) return { x: 8, y: -5 };
      if (index === 2) return { x: -11, y: 7 };
      return { x: 0, y: 0 };
    })
  };
  const geometry = presentationGeometry(corrected);
  assert.deepEqual(geometry.padding, { left: 8, right: 11, top: 7, bottom: 5 });
  assert.equal(geometry.width, corrected.frameWidth + 19);
  assert.equal(geometry.height, corrected.frameHeight + 12);
});

test("every destination rectangle stays fully inside the presentation canvas", () => {
  for (const animations of Object.values(ANIMATION_LIBRARY)) {
    for (const animation of Object.values(animations)) {
      const geometry = presentationGeometry(animation);
      for (let frame = 0; frame < animation.frameCount; frame += 1) {
        const destination = frameDestinationRect(animation, frame);
        assert.ok(destination.x >= 0);
        assert.ok(destination.y >= 0);
        assert.ok(destination.x + destination.width <= geometry.width);
        assert.ok(destination.y + destination.height <= geometry.height);
      }
    }
  }
});
