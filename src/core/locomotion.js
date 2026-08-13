const INPUT_DEADZONE = 0.15;

export function normalizeFacing(facing) {
  return facing < 0 ? -1 : 1;
}

export function resolveHorizontalMovement({ inputAxis, facing, tuning }) {
  if (!Number.isFinite(inputAxis)) {
    throw new TypeError("inputAxis must be a finite number");
  }
  if (!tuning || tuning.walkForward <= 0 || tuning.walkBackward <= 0) {
    throw new TypeError("tuning requires positive walkForward and walkBackward speeds");
  }

  const axis = Math.max(-1, Math.min(1, inputAxis));
  if (Math.abs(axis) < INPUT_DEADZONE) {
    return Object.freeze({ direction: "idle", axis: 0, velocityX: 0 });
  }

  const worldAxis = Math.sign(axis);
  const relativeAxis = worldAxis * normalizeFacing(facing);
  const direction = relativeAxis > 0 ? "forward" : "backward";
  const speed = direction === "forward" ? tuning.walkForward : tuning.walkBackward;

  return Object.freeze({
    direction,
    axis: worldAxis,
    velocityX: worldAxis * speed
  });
}
