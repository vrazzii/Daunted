const IDLE_GRID = Object.freeze({
  frameWidth: 362,
  frameHeight: 362,
  columns: 4,
  rows: 3,
  frameCount: 12
});

const IDLE_ASSETS = Object.freeze({
  knight: Object.freeze({
    code: "kni",
    origin: Object.freeze({ x: 181, y: 332 }),
    frameTicks: Object.freeze(Array(12).fill(6)),
    frameOffsetsY: Object.freeze([-7, -7, -8, -8, 1, 0, 0, 0, 3, 3, 3, 3])
  }),
  wolf: Object.freeze({
    code: "wlf",
    origin: Object.freeze({ x: 181, y: 336 }),
    frameTicks: Object.freeze([6, 5, 5, 5, 6, 7, 6, 5, 5, 5, 7, 8]),
    frameOffsetsY: Object.freeze([-13, -13, -13, -13, 0, -1, 0, 0, 11, 10, 10, 10])
  }),
  "veiled-saint": Object.freeze({
    code: "vst",
    origin: Object.freeze({ x: 181, y: 345 }),
    frameTicks: Object.freeze(Array(12).fill(8)),
    frameOffsetsY: Object.freeze([-10, -10, -10, -10, 0, 0, 0, 0, 21, 21, 21, 21])
  })
});

function createIdle(fighterId) {
  const asset = IDLE_ASSETS[fighterId];
  return Object.freeze({
    fighterId,
    id: "idle",
    label: "Idle",
    category: "neutral",
    status: "ready",
    sheet: `assets/sprites/${fighterId}/idle.png`,
    preview: `assets/previews/${fighterId}/idle-preview.png`,
    sourceManifest: `assets/sprites/${fighterId}/idle-manifest.json`,
    version: "v01",
    ...IDLE_GRID,
    origin: asset.origin,
    sequence: Object.freeze(Array.from({ length: 12 }, (_, index) => index)),
    ticksPerFrame: asset.frameTicks[0],
    frameTicks: asset.frameTicks,
    frameOffsets: Object.freeze(asset.frameOffsetsY.map(y => Object.freeze({ x: 0, y }))),
    loop: true
  });
}

export const ANIMATION_LIBRARY = Object.freeze({
  knight: Object.freeze({
    idle: createIdle("knight")
  }),
  wolf: Object.freeze({
    idle: createIdle("wolf")
  }),
  "veiled-saint": Object.freeze({
    idle: createIdle("veiled-saint")
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
