export const BALANCE_BASELINE = Object.freeze({
  maxHealth: 1000,
  walkForward: 280,
  walkBackward: 220,
  dashSpeed: 480,
  jumpVelocity: 850,
  gravity: 2400,
  weight: 1,
  damageScale: 1,
  knockbackScale: 1,
  hurtboxScale: 1
});

export const FIGHTER_TUNING = Object.freeze({
  knight: Object.freeze({
    maxHealth: 950,
    walkForward: 320,
    walkBackward: 255,
    dashSpeed: 560,
    jumpVelocity: 890,
    gravity: 2350,
    weight: 0.94,
    damageScale: 0.92,
    knockbackScale: 0.96,
    hurtboxScale: 0.96
  }),
  wolf: Object.freeze({
    maxHealth: 1120,
    walkForward: 230,
    walkBackward: 175,
    dashSpeed: 390,
    jumpVelocity: 770,
    gravity: 2550,
    weight: 1.2,
    damageScale: 1.16,
    knockbackScale: 1.12,
    hurtboxScale: 1.16
  }),
  "veiled-saint": Object.freeze({
    ...BALANCE_BASELINE
  })
});

const POSITIVE_FIELDS = Object.freeze(Object.keys(BALANCE_BASELINE));

export function validateBalanceTuning(tuning = FIGHTER_TUNING) {
  const errors = [];

  for (const [fighterId, values] of Object.entries(tuning)) {
    for (const field of POSITIVE_FIELDS) {
      if (!Number.isFinite(values[field]) || values[field] <= 0) {
        errors.push(`${fighterId}.${field} must be a positive number`);
      }
    }
  }

  const knight = tuning.knight;
  const wolf = tuning.wolf;

  if (knight && wolf) {
    if (wolf.walkForward >= knight.walkForward) {
      errors.push("Wolf must walk slower than Knight");
    }
    if (wolf.dashSpeed >= knight.dashSpeed) {
      errors.push("Wolf must dash slower than Knight");
    }
    if (wolf.damageScale <= knight.damageScale) {
      errors.push("Wolf must hit harder than Knight");
    }
    if (wolf.maxHealth <= knight.maxHealth) {
      errors.push("Wolf must have more health than Knight");
    }
    if (wolf.hurtboxScale <= knight.hurtboxScale) {
      errors.push("Wolf must pay for durability with a larger hurtbox");
    }
  }

  return errors;
}

export function tuningDelta(fighterId, field) {
  const value = FIGHTER_TUNING[fighterId]?.[field];
  const baseline = BALANCE_BASELINE[field];

  if (!Number.isFinite(value) || !Number.isFinite(baseline)) {
    return null;
  }

  return (value - baseline) / baseline;
}
