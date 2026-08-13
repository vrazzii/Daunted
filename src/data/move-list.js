const move = (name, input, purpose, animation, options = {}) => Object.freeze({
  name, input, purpose, animation,
  strength: options.strength ?? "essential",
  note: options.note ?? ""
});

export const INPUT_LEGEND = Object.freeze([
  Object.freeze({ token: "L", label: "Light attack" }),
  Object.freeze({ token: "H", label: "Heavy attack" }),
  Object.freeze({ token: "→", label: "Toward opponent" }),
  Object.freeze({ token: "←", label: "Away from opponent" }),
  Object.freeze({ token: "↓↘→", label: "Quarter-circle forward" }),
  Object.freeze({ token: "→↘↓↙←", label: "Half-circle back" }),
  Object.freeze({ token: "[←] →", label: "Hold back, then forward" }),
  Object.freeze({ token: "[↓] ↑", label: "Hold down, then up" })
]);

export const UNIVERSAL_MOVES = Object.freeze([
  move("Standing Light", "L", "Fast pressure and confirms.", "Standing Light sheet"),
  move("Standing Heavy", "H", "Committed damage and space control.", "Standing Heavy sheet"),
  move("Crouching Light", "↓ + L", "Low, accessible interrupt.", "Crouching Light sheet"),
  move("Crouching Heavy", "↓ + H", "Character-specific low or launcher.", "Crouching Heavy sheet"),
  move("Jumping Light", "Air + L", "Quick air-to-air or jump-in.", "Jumping Light sheet"),
  move("Jumping Heavy", "Air + H", "Committed aerial attack.", "Jumping Heavy sheet"),
  move("Anti-Air", "↓↘→ + L", "Reliable grounded anti-air.", "Anti-Air sheet"),
  move("Throw", "L + H", "Close-range answer to blocking.", "Grab suite", { note: "Fails outside throw range." }),
  move("Standing Guard", "Hold ←", "Blocks standing and aerial attacks.", "Defense sheet"),
  move("Crouching Guard", "Hold ↙", "Blocks low attacks.", "Defense sheet"),
  move("Forward Dash", "→ →", "Rapid forward repositioning.", "Dash sheet"),
  move("Back Dash", "← ←", "Committed defensive repositioning.", "Dash sheet")
]);

export const FIGHTER_MOVE_LISTS = Object.freeze({
  wolf: Object.freeze({
    title: "Vicious pursuit",
    identity: "Aggressive motions, rapid follow-ups, lunges, and close command grabs.",
    moves: Object.freeze([
      move("Predator Lunge", "↓↘→ + L", "Fast advancing strike for closing space.", "Lunge startup, travel, claw impact, recovery", { strength: "special" }),
      move("Ravaging Lunge", "↓↘→ + H", "Slower armored commitment with greater damage.", "Heavy lunge and distinct punishable recovery", { strength: "special" }),
      move("Rend Sequence", "↓↘→ + L, L, L", "Timing-based claw follow-ups after Predator Lunge.", "Two readable follow-up strikes", { strength: "special", note: "Each follow-up increases commitment." }),
      move("Hunting Pounce", "[↓] ↑ + H", "Leaping approach that changes Wolfbeast's attack angle.", "Crouched coil, leap, descending hit, landing", { strength: "special" }),
      move("Crushing Maul", "→↘↓↙← + H", "Close command grab that punishes passive defense.", "Grab connect, maul sequence, opponent release", { strength: "special", note: "Whiff is highly punishable." }),
      move("Blood-Moon Rampage", "↓↘→ ↓↘→ + L + H", "High-cost super rush ending in a brutal launch.", "Super freeze, rush chain, finisher, recovery", { strength: "super" })
    ])
  }),
  knight: Object.freeze({
    title: "Clean, crisp, calculated",
    identity: "Deliberate charges, precise command normals, parries, and timed follow-ups.",
    moves: Object.freeze([
      move("Royal Thrust", "→ + H", "Long command normal for precise grounded control.", "Measured step, thrust, blade recovery", { strength: "command" }),
      move("Vanguard Line", "[←] → + L", "Charge attack that converts defense into forward control.", "Guarded charge, advancing cut, stop", { strength: "special" }),
      move("Crown Breaker", "[←] → + H", "Slower charge slash with pushback and guard pressure.", "Heavy charge, broad slash, long recovery", { strength: "special" }),
      move("King's Ascent", "[↓] ↑ + H", "Deliberate anti-air with strong vertical coverage.", "Crouched charge, rising blade, landing", { strength: "special" }),
      move("Measured Parry", "↓ + L + H", "Brief precision parry that creates a timed response window.", "Parry stance, success flash, failure recovery", { strength: "special", note: "Throws and delayed attacks beat it." }),
      move("Royal Reprisal", "After parry: → + H", "Chosen heavy response after a successful parry.", "Parry-only counter thrust", { strength: "special" }),
      move("Sovereign Judgment", "[←] → ← → + L + H", "Charge super rewarding maintained composure.", "Super freeze, decisive advance, multi-cut finish", { strength: "super" })
    ])
  }),
  "veiled-saint": Object.freeze({
    title: "Aware, accurate, anointed",
    identity: "Controlled patterns, held inputs, counters, and position-dependent commands.",
    moves: Object.freeze([
      move("Halo Mark", "↓↘→ + L", "Places a controlled mark at measured range.", "Halo release, traveling mark, placement effect", { strength: "special" }),
      move("Anointed Arc", "↓↙← + H", "Repositions a halo sweep around her current space.", "Halo orbit, sweep, return", { strength: "special" }),
      move("Held Revelation", "Hold H, release", "Variable-timing strike whose range grows while held.", "Three charge tells, release, recovery", { strength: "special", note: "Holding limits access to Heavy." }),
      move("Veiled Answer", "←↙↓ + L + H", "Controlled counter against predictable grounded attacks.", "Counter pose, success bind, failed recovery", { strength: "special", note: "Throws and aerial attacks bypass it." }),
      move("Near-Sight Decree", "Near mark: → + H", "Accurate close conversion when positioned by Halo Mark.", "Mark recall into close strike", { strength: "command" }),
      move("Far-Sight Decree", "Far mark: → + H", "Long-range conversion with slower recovery.", "Distant halo convergence", { strength: "command" }),
      move("Anointed Sight", "↓↘→ ↓↘→ + L + H", "Position-dependent super that converges active marks.", "Super freeze, mark convergence, divine impact", { strength: "super" })
    ])
  })
});

export function moveListFor(fighterId) {
  return FIGHTER_MOVE_LISTS[fighterId] ?? null;
}

export function validateMoveLists() {
  const errors = [];
  for (const [fighterId, list] of Object.entries(FIGHTER_MOVE_LISTS)) {
    if (!list.title || !list.identity || !list.moves.length) errors.push(`${fighterId}: move list metadata is incomplete`);
    list.moves.forEach((entry, index) => {
      for (const field of ["name", "input", "purpose", "animation"]) {
        if (!entry[field]) errors.push(`${fighterId}[${index}]: ${field} is required`);
      }
    });
  }
  return errors;
}
