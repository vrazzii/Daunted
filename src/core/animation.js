const INTEGER_FIELDS = Object.freeze([
  "frameWidth",
  "frameHeight",
  "columns",
  "rows",
  "frameCount",
  "ticksPerFrame"
]);

export function validateAnimationDefinition(animation) {
  const errors = [];

  if (!animation || typeof animation !== "object") {
    return ["Animation definition must be an object"];
  }

  for (const field of INTEGER_FIELDS) {
    if (!Number.isInteger(animation[field]) || animation[field] <= 0) {
      errors.push(`${field} must be a positive integer`);
    }
  }

  if (!animation.id) errors.push("id is required");
  if (!animation.fighterId) errors.push("fighterId is required");
  if (!animation.sheet) errors.push("sheet is required");
  if (!["pending", "ready"].includes(animation.status)) {
    errors.push("status must be pending or ready");
  }

  if (!Array.isArray(animation.sequence)) {
    errors.push("sequence must be an array");
  } else {
    if (animation.sequence.length !== animation.frameCount) {
      errors.push("sequence length must equal frameCount");
    }

    const capacity = animation.columns * animation.rows;
    for (const frame of animation.sequence) {
      if (!Number.isInteger(frame) || frame < 0 || frame >= capacity) {
        errors.push(`sequence frame ${frame} is outside the declared grid`);
      }
    }
  }

  const { origin } = animation;
  if (!origin || !Number.isFinite(origin.x) || !Number.isFinite(origin.y)) {
    errors.push("origin requires numeric x and y values");
  } else if (
    origin.x < 0 ||
    origin.x > animation.frameWidth ||
    origin.y < 0 ||
    origin.y > animation.frameHeight
  ) {
    errors.push("origin must be inside the frame cell");
  }

  if (
    animation.frameTicks &&
    (!Array.isArray(animation.frameTicks) ||
      animation.frameTicks.length !== animation.frameCount ||
      animation.frameTicks.some(value => !Number.isInteger(value) || value <= 0))
  ) {
    errors.push("frameTicks must contain one positive integer per logical frame");
  }

  return [...new Set(errors)];
}

export function expectedSheetSize(animation) {
  return {
    width: animation.frameWidth * animation.columns,
    height: animation.frameHeight * animation.rows
  };
}

export function frameSourceRect(animation, logicalFrameIndex) {
  const normalized = normalizeFrame(logicalFrameIndex, animation.frameCount);
  const sheetFrame = animation.sequence[normalized];

  return {
    x: (sheetFrame % animation.columns) * animation.frameWidth,
    y: Math.floor(sheetFrame / animation.columns) * animation.frameHeight,
    width: animation.frameWidth,
    height: animation.frameHeight,
    logicalFrame: normalized,
    sheetFrame
  };
}

function normalizeFrame(index, frameCount) {
  return ((index % frameCount) + frameCount) % frameCount;
}

export class AnimationPlayer {
  constructor(animation) {
    this.playbackRate = 1;
    this.playing = true;
    this.setAnimation(animation);
  }

  setAnimation(animation) {
    const errors = validateAnimationDefinition(animation);
    if (errors.length) {
      throw new TypeError(`Invalid animation: ${errors.join("; ")}`);
    }

    this.animation = animation;
    this.frameIndex = 0;
    this.elapsedTicks = 0;
    this.completed = false;
  }

  setPlaybackRate(rate) {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new RangeError("Playback rate must be a positive number");
    }
    this.playbackRate = rate;
  }

  play() {
    if (this.completed && !this.animation.loop) this.seek(0);
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  toggle() {
    this.playing = !this.playing;
    return this.playing;
  }

  seek(index) {
    const last = this.animation.frameCount - 1;
    this.frameIndex = this.animation.loop
      ? normalizeFrame(index, this.animation.frameCount)
      : Math.max(0, Math.min(last, index));
    this.elapsedTicks = 0;
    this.completed = false;
  }

  step(direction = 1) {
    this.pause();
    this.seek(this.frameIndex + Math.sign(direction || 1));
  }

  ticksForCurrentFrame() {
    return this.animation.frameTicks?.[this.frameIndex] ?? this.animation.ticksPerFrame;
  }

  updateTicks(ticks = 1) {
    if (!this.playing || this.completed || ticks <= 0) return false;

    this.elapsedTicks += ticks * this.playbackRate;
    let changed = false;
    let safety = this.animation.frameCount * 4;

    while (this.elapsedTicks >= this.ticksForCurrentFrame() && safety > 0) {
      this.elapsedTicks -= this.ticksForCurrentFrame();
      changed = this.advanceFrame() || changed;
      safety -= 1;
      if (this.completed) break;
    }

    return changed;
  }

  advanceFrame() {
    const next = this.frameIndex + 1;
    if (next < this.animation.frameCount) {
      this.frameIndex = next;
      return true;
    }

    if (this.animation.loop) {
      this.frameIndex = 0;
      return true;
    }

    this.frameIndex = this.animation.frameCount - 1;
    this.completed = true;
    this.pause();
    return false;
  }

  snapshot() {
    return Object.freeze({
      animationId: this.animation.id,
      frameIndex: this.frameIndex,
      sheetFrame: this.animation.sequence[this.frameIndex],
      playing: this.playing,
      completed: this.completed,
      playbackRate: this.playbackRate
    });
  }
}
