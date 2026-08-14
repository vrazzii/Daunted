import test from "node:test";
import assert from "node:assert/strict";
import { ANIMATION_LIBRARY } from "../src/data/animation-library.js";

test("malformed Wolf forward walk remains quarantined until replaced", () => {
  const animation = ANIMATION_LIBRARY.wolf["walk-forward"];
  assert.equal(animation.status, "pending");
  assert.match(animation.statusReason, /Malformed PNG/);
});
