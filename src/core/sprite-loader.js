import { expectedSheetSize } from "./animation.js";

export function validateLoadedSheet(image, animation) {
  const expected = expectedSheetSize(animation);
  const actualWidth = image.naturalWidth ?? image.width;
  const actualHeight = image.naturalHeight ?? image.height;
  const errors = [];

  if (actualWidth !== expected.width) {
    errors.push(`width ${actualWidth}; expected ${expected.width}`);
  }
  if (actualHeight !== expected.height) {
    errors.push(`height ${actualHeight}; expected ${expected.height}`);
  }

  return errors;
}

export class SpriteSheetCache {
  constructor() {
    this.entries = new Map();
  }

  clear() {
    this.entries.clear();
  }

  async load(animation) {
    if (animation.status !== "ready") {
      return {
        status: "pending",
        image: null,
        errors: [`${animation.sheet} is not marked ready`]
      };
    }

    if (!this.entries.has(animation.sheet)) {
      this.entries.set(animation.sheet, this.loadImage(animation));
    }

    return this.entries.get(animation.sheet);
  }

  loadImage(animation) {
    return new Promise(resolve => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const errors = validateLoadedSheet(image, animation);
        resolve({ status: errors.length ? "invalid" : "ready", image, errors });
      };
      image.onerror = () => {
        resolve({
          status: "missing",
          image: null,
          errors: [`Unable to load ${animation.sheet}`]
        });
      };
      image.src = animation.sheet;
    });
  }
}
