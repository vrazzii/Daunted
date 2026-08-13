const CODE = Object.freeze({ knight: "kni", wolf: "wlf", "veiled-saint": "vst" });
const ROOT = "assets/library";
const LIGHT = Object.freeze([2, 2, 1, 2, 2, 3, 3, 4]);
const HEAVY = Object.freeze([3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 4, 5]);
const WALK = Object.freeze({ knight: 4, wolf: 6, "veiled-saint": 5 });
const IDLE = Object.freeze({
  knight: Object.freeze({ origin: { x: 181, y: 332 }, ticks: Array(12).fill(6), offsets: [-7, -7, -8, -8, 1, 0, 0, 0, 3, 3, 3, 3] }),
  wolf: Object.freeze({ origin: { x: 181, y: 336 }, ticks: [6, 5, 5, 5, 6, 7, 6, 5, 5, 5, 7, 8], offsets: [-13, -13, -13, -13, 0, -1, 0, 0, 11, 10, 10, 10] }),
  "veiled-saint": Object.freeze({ origin: { x: 181, y: 345 }, ticks: Array(12).fill(8), offsets: [-10, -10, -10, -10, 0, 0, 0, 0, 21, 21, 21, 21] })
});

function choose(fighterId, standard, wolf = standard, knight = standard) {
  return fighterId === "wolf" ? wolf : fighterId === "knight" ? knight : standard;
}

function create({ fighterId, id, label, category, path, size, columns, rows, count = columns * rows, frameTicks, ticks = 4, loop = false, sequence, origin, offsets }) {
  const [sheetWidth, sheetHeight] = size;
  const frameWidth = Math.floor(sheetWidth / columns);
  const frameHeight = Math.floor(sheetHeight / rows);
  const durations = frameTicks ?? Array(count).fill(ticks);
  return Object.freeze({
    fighterId, id, label, category, status: "ready", sheet: path, version: "v01",
    sheetWidth, sheetHeight, frameWidth, frameHeight, columns, rows, frameCount: count,
    origin: Object.freeze(origin ?? { x: Math.floor(frameWidth / 2), y: Math.max(1, frameHeight - 1) }),
    sequence: Object.freeze(sequence ?? Array.from({ length: count }, (_, index) => index)),
    ticksPerFrame: durations[0], frameTicks: Object.freeze(durations),
    frameOffsets: Object.freeze((offsets ?? Array(count).fill(0)).map(y => Object.freeze({ x: 0, y }))),
    loop
  });
}

function path(pack, file) { return `${ROOT}/${pack}/${file}`; }

const SPECS = Object.freeze([
  { id: "walk-forward", label: "Walk Forward", category: "movement", pack: "daunted_walking_v01", file: "daunted_{code}_walk_f_sheet_v01.png", size: [1448, 1086], columns: 4, rows: 3, count: 12, perFighter: WALK, loop: true },
  { id: "walk-backward", label: "Walk Backward", category: "movement", pack: "daunted_walking_v01", file: "daunted_{code}_walk_b_sheet_v01.png", size: [1448, 1086], columns: 4, rows: 3, count: 12, perFighter: WALK, loop: true },
  { id: "standing-light", label: "Standing Light", category: "attack", pack: "daunted_standing_light_v01", file: "daunted_{code}_atk_5l_sheet_v01.png", size: [1448, 724], columns: 4, rows: 2, count: 8, frameTicks: LIGHT },
  { id: "standing-heavy", label: "Standing Heavy", category: "attack", pack: "daunted_standing_heavy_v01", file: "daunted_{code}_atk_5h_sheet_v01.png", size: [1448, 1086], columns: 4, rows: 3, count: 12, frameTicks: HEAVY },
  { id: "crouching-light", label: "Crouching Light", category: "attack", pack: "daunted_crouching_light_v01", file: "daunted_{code}_atk_2l_sheet_v01.png", size: [1536, 1024], wolf: [1672, 941], knight: [1491, 1055], columns: 4, rows: 2, count: 8, frameTicks: LIGHT },
  { id: "crouching-heavy", label: "Crouching Heavy", category: "attack", pack: "daunted_crouching_heavy_v01", file: "daunted_{code}_atk_2h_sheet_v01.png", size: [1536, 1024], wolf: [1672, 941], columns: 4, rows: 2, count: 8, ticks: 3 },
  { id: "jumping-light", label: "Jumping Light", category: "attack", pack: "daunted_jumping_light_v01", file: "daunted_{code}_atk_jl_sheet_v01.png", size: [1536, 1024], wolf: [1672, 941], columns: 4, rows: 2, count: 8, frameTicks: LIGHT },
  { id: "jumping-heavy", label: "Jumping Heavy", category: "attack", pack: "daunted_jumping_heavy_v01", file: "daunted_{code}_atk_jh_sheet_v01.png", size: [1672, 941], columns: 4, rows: 2, count: 8, ticks: 3 },
  { id: "anti-air", label: "Anti-Air", category: "attack", pack: "daunted_anti_air_v01", file: "daunted_{code}_atk_aa_sheet_v01.png", size: [1536, 1024], wolf: [1448, 1086], columns: 4, rows: 2, count: 8, ticks: 3 },
  { id: "dash", label: "Dash / Backdash", category: "movement", pack: "daunted_dash_v01", file: "daunted_{code}_dash_sheet_v01.png", size: [1536, 1024], columns: 4, rows: 3, count: 12, perFighter: { knight: 3, wolf: 5, "veiled-saint": 4 } },
  { id: "jump-movement", label: "Jump Movement", category: "movement", pack: "daunted_jump_movement_v01", file: "daunted_{code}_jump_move_sheet_v01.png", size: [1536, 1024], columns: 4, rows: 3, count: 12, perFighter: { knight: 4, wolf: 6, "veiled-saint": 5 } },
  { id: "grab-suite", label: "Grab / Throw", category: "attack", pack: "daunted_grab_suite_v01", file: "daunted_{code}_grab_suite_sheet_v01.png", size: [1536, 1024], columns: 4, rows: 3, count: 12, ticks: 4 },
  { id: "defense", label: "Defense / Guard Break", category: "defense", pack: "daunted_defense_v01", file: "daunted_{code}_defense_sheet_v01.png", size: [1536, 1536], columns: 4, rows: 4, count: 16, ticks: 5 },
  { id: "damage-reactions", label: "Damage Reactions", category: "reaction", pack: "daunted_damage_reactions_v01", file: "daunted_{code}_damage_reactions_sheet_v01.png", size: [1600, 1280], columns: 5, rows: 4, count: 20, ticks: 4 }
]);

function characterAnimation(fighterId, spec) {
  return create({
    fighterId, id: spec.id, label: spec.label, category: spec.category,
    path: path(spec.pack, spec.file.replace("{code}", CODE[fighterId])),
    size: choose(fighterId, spec.size, spec.wolf, spec.knight), columns: spec.columns, rows: spec.rows,
    count: spec.count, frameTicks: spec.frameTicks, ticks: spec.perFighter?.[fighterId] ?? spec.ticks,
    loop: spec.loop
  });
}

function idle(fighterId) {
  const data = IDLE[fighterId];
  return create({ fighterId, id: "idle", label: "Idle", category: "neutral", path: `assets/sprites/${fighterId}/idle.png`, size: [1448, 1086], columns: 4, rows: 3, count: 12, frameTicks: data.ticks, loop: true, origin: data.origin, offsets: data.offsets });
}

function fx(fighterId, id, label, pack, file, size, sequence) {
  const rows = sequence ? 3 : 2;
  return create({ fighterId, id, label, category: "effect", path: path(pack, file), size, columns: 4, rows, count: sequence?.length ?? 8, sequence, ticks: 3, origin: { x: Math.floor(size[0] / 8), y: Math.floor(size[1] / rows / 2) } });
}

const EFFECTS = Object.freeze({
  knight: [
    fx("knight", "anti-air-fx", "Anti-Air FX", "daunted_anti_air_v01", "daunted_kni_atk_aa_fx_sheet_v01.png", [1536, 1024]),
    fx("knight", "crouching-heavy-fx", "Crouching Heavy FX", "daunted_crouching_heavy_v01", "daunted_kni_atk_2h_fx_sheet_v01.png", [1536, 1024]),
    fx("knight", "jumping-heavy-fx", "Jumping Heavy FX", "daunted_jumping_heavy_v01", "daunted_kni_atk_jh_fx_sheet_v01.png", [1672, 941]),
    fx("knight", "guard-fx", "Guard FX", "daunted_defense_v01", "daunted_guard_fx_sheet_v01.png", [1536, 1024], [4, 5, 6, 7])
  ],
  wolf: [fx("wolf", "guard-fx", "Guard FX", "daunted_defense_v01", "daunted_guard_fx_sheet_v01.png", [1536, 1024], [0, 1, 2, 3])],
  "veiled-saint": [
    fx("veiled-saint", "anti-air-fx", "Anti-Air FX", "daunted_anti_air_v01", "daunted_vst_atk_aa_fx_sheet_v01.png", [1536, 1024]),
    fx("veiled-saint", "crouching-light-fx", "Crouching Light FX", "daunted_crouching_light_v01", "daunted_vst_atk_2l_fx_sheet_v01.png", [1536, 1024]),
    fx("veiled-saint", "crouching-heavy-fx", "Crouching Heavy FX", "daunted_crouching_heavy_v01", "daunted_vst_atk_2h_fx_sheet_v01.png", [1536, 1024]),
    fx("veiled-saint", "jumping-light-fx", "Jumping Light FX", "daunted_jumping_light_v01", "daunted_vst_atk_jl_fx_sheet_v01.png", [1536, 1024]),
    fx("veiled-saint", "jumping-heavy-fx", "Jumping Heavy FX", "daunted_jumping_heavy_v01", "daunted_vst_atk_jh_fx_sheet_v01.png", [1672, 941]),
    fx("veiled-saint", "guard-fx", "Guard FX", "daunted_defense_v01", "daunted_guard_fx_sheet_v01.png", [1536, 1024], [8, 9, 10, 11])
  ]
});

function library(fighterId) {
  const entries = [idle(fighterId), ...SPECS.map(spec => characterAnimation(fighterId, spec)), ...EFFECTS[fighterId]];
  return Object.freeze(Object.fromEntries(entries.map(animation => [animation.id, animation])));
}

export const ANIMATION_LIBRARY = Object.freeze({ knight: library("knight"), wolf: library("wolf"), "veiled-saint": library("veiled-saint") });
export const PRODUCTION_ORDER = Object.freeze([
  { id: "idle", label: "Idle", phase: 1 }, { id: "walk-forward", label: "Walk Forward", phase: 2 }, { id: "walk-backward", label: "Walk Backward", phase: 2 },
  { id: "basic-attacks", label: "Basic Attacks", phase: 3 }, { id: "movement-jumps", label: "Movement / Jumps", phase: 4 },
  { id: "damage-knockdown", label: "Damage / Knockdown", phase: 5 }, { id: "specials", label: "Specials", phase: 6 }, { id: "supers", label: "Supers", phase: 7 }
].map(Object.freeze));
export function animationsFor(fighterId) { return ANIMATION_LIBRARY[fighterId] ?? {}; }
export function getAnimation(fighterId, animationId) { return ANIMATION_LIBRARY[fighterId]?.[animationId] ?? null; }
