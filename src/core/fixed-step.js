export class FixedStepAccumulator {
  constructor({ hz = 60, maxSteps = 5 } = {}) {
    if (!Number.isFinite(hz) || hz <= 0) throw new RangeError("hz must be positive");
    if (!Number.isInteger(maxSteps) || maxSteps <= 0) {
      throw new RangeError("maxSteps must be a positive integer");
    }

    this.hz = hz;
    this.stepMs = 1000 / hz;
    this.maxSteps = maxSteps;
    this.accumulatorMs = 0;
  }

  reset() {
    this.accumulatorMs = 0;
  }

  push(deltaMs, onStep) {
    const safeDelta = Math.max(0, Math.min(deltaMs, this.stepMs * this.maxSteps));
    this.accumulatorMs += safeDelta;
    let steps = 0;

    // A tiny tolerance prevents 5 * 16.666…ms from becoming four steps due
    // to floating-point rounding at the catch-up boundary.
    while (this.accumulatorMs + 1e-9 >= this.stepMs && steps < this.maxSteps) {
      onStep?.(1 / this.hz);
      this.accumulatorMs = Math.max(0, this.accumulatorMs - this.stepMs);
      steps += 1;
    }

    return {
      steps,
      alpha: this.accumulatorMs / this.stepMs
    };
  }
}
