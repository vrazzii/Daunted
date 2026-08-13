const NON_NEGATIVE_INTEGER_FIELDS = Object.freeze([
  "startup",
  "recovery",
  "damage",
  "hitstun",
  "blockstun",
  "hitstop"
]);

export function totalMoveTicks(move) {
  return move.startup + move.active + move.recovery;
}

export function movePhaseAt(move, tick) {
  if (!Number.isInteger(tick) || tick < 0) return "invalid";
  if (tick < move.startup) return "startup";
  if (tick < move.startup + move.active) return "active";
  if (tick < totalMoveTicks(move)) return "recovery";
  return "complete";
}

export function validateMoveDefinition(move) {
  const errors = [];

  if (!move || typeof move !== "object") {
    return ["Move definition must be an object"];
  }

  if (!move.id) errors.push("id is required");
  if (!move.animation) errors.push("animation is required");
  if (!move.input) errors.push("input is required");

  for (const field of NON_NEGATIVE_INTEGER_FIELDS) {
    if (!Number.isInteger(move[field]) || move[field] < 0) {
      errors.push(`${field} must be a non-negative integer`);
    }
  }

  if (!Number.isInteger(move.active) || move.active <= 0) {
    errors.push("active must be a positive integer");
  }

  if (!Array.isArray(move.hitboxes)) {
    errors.push("hitboxes must be an array");
  } else {
    const end = Number.isFinite(move.startup) && Number.isFinite(move.active)
      ? move.startup + move.active - 1
      : -1;

    move.hitboxes.forEach((window, index) => {
      if (!Number.isInteger(window.from) || !Number.isInteger(window.to)) {
        errors.push(`hitboxes[${index}] requires integer from/to ticks`);
      } else if (window.from < move.startup || window.to > end || window.from > window.to) {
        errors.push(`hitboxes[${index}] must stay inside the active phase`);
      }

      const box = window.box;
      if (
        !box ||
        ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
        box.width <= 0 ||
        box.height <= 0
      ) {
        errors.push(`hitboxes[${index}].box must be a positive rectangle`);
      }
    });
  }

  return [...new Set(errors)];
}
