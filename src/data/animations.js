const IDLE_GRID = Object.freeze({
  frameWidth: 768,
  frameHeight: 512,
  columns: 4,
  rows: 4,
  frameCount: 16,
  origin: Object.freeze({ x: 384, y: 464 })
});

function createIdle(fighterId, ticksPerFrame) {
  return Object.freeze({
    fighterId,
    id: "idle",
    label: "Idle",
    category: "neutral",
    status: "pending",
    sheet: `assets/sprites/${fighterId}/idle.png`,
    preview: `assets/previews/${fighterId}/idle-preview.png`,
    ...IDLE_GRID,
    sequence: Object.freeze(Array.from({ length: 16 }, (_, index) => index)),
    ticksPerFrame,
    loop: true
  });
}

export const ANIMATION_LIBRARY = Object.freeze({
  knight: Object.freeze({
    idle: createIdle("knight", 6)
  }),
  wolf: Object.freeze({
    idle: createIdle("wolf", 8)
  }),
  "veiled-saint": Object.freeze({
    idle: createIdle("veiled-saint", 7)
  })
});

export const PRODUCTION_ORDER = Object.freeze([
  Object.freeze({ id: "idle", label: "Idle", phase: 1 }),
  Object.freeze({ id: "walk-forward", label: "Walk Forward", phase: 2 }),
  Object.freeze({ id: "walk-backward", label: "Walk Backward", phase: 2 }),
  Object.freeze({ id: "basic-attacks", label: "Basic Attacks", phase: 3 }),
  Object.freeze({ id: "movement-jumps", label: "Movement / Jumps", phase: 4 }),
  Object.freeze({ id: "damage-knockdown", label: "Damage / Knockdown", phase: 5 }),
  Object.freeze({ id: "specials", label: "Specials", phase: 6 }),
  Object.freeze({ id: "supers", label: "Supers", phase: 7 })
]);

export function animationsFor(fighterId) {
  return ANIMATION_LIBRARY[fighterId] ?? {};
}

export function getAnimation(fighterId, animationId) {
  return ANIMATION_LIBRARY[fighterId]?.[animationId] ?? null;
}
