import test from "node:test";
import assert from "node:assert/strict";
import { FixedStepAccumulator } from "../src/core/fixed-step.js";

test("fixed-step accumulator produces deterministic 60 Hz steps", () => {
  const clock = new FixedStepAccumulator({ hz: 60, maxSteps: 5 });
  let steps = 0;
  const result = clock.push(1000 / 30, () => { steps += 1; });
  assert.equal(steps, 2);
  assert.equal(result.steps, 2);
});

test("fixed-step accumulator caps catch-up after a stall", () => {
  const clock = new FixedStepAccumulator({ hz: 60, maxSteps: 5 });
  let steps = 0;
  clock.push(1000, () => { steps += 1; });
  assert.equal(steps, 5);
});
