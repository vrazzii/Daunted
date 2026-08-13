import test from "node:test";
import assert from "node:assert/strict";
import { BALANCE_BASELINE, FIGHTER_TUNING, validateBalanceTuning } from "../src/data/balance.js";

test("provisional fighter tuning satisfies the balance contract", () => {
  assert.deepEqual(validateBalanceTuning(), []);
});

test("Wolf trades speed and size for health and impact", () => {
  const wolf = FIGHTER_TUNING.wolf;
  const knight = FIGHTER_TUNING.knight;
  assert.ok(wolf.walkForward < knight.walkForward);
  assert.ok(wolf.dashSpeed < knight.dashSpeed);
  assert.ok(wolf.damageScale > knight.damageScale);
  assert.ok(wolf.maxHealth > knight.maxHealth);
  assert.ok(wolf.hurtboxScale > knight.hurtboxScale);
});

test("Veiled Saint remains at baseline until approved moves define her role", () => {
  assert.deepEqual(FIGHTER_TUNING["veiled-saint"], BALANCE_BASELINE);
});
