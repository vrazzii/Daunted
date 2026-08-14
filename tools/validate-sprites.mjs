import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANIMATION_LIBRARY } from "../src/data/animations.js";
import { expectedSheetSize, validateAnimationDefinition } from "../src/core/animation.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let failures = 0;
let checked = 0;
let pending = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function parsePngHeader(buffer) {
  if (buffer.length < 26 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("not a valid PNG header");
  }

  if (buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("PNG is missing its IHDR chunk");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25]
  };
}

for (const animations of Object.values(ANIMATION_LIBRARY)) {
  for (const animation of Object.values(animations)) {
    const label = `${animation.fighterId}/${animation.id}`;
    const definitionErrors = validateAnimationDefinition(animation);
    if (definitionErrors.length) {
      definitionErrors.forEach(error => fail(`${label}: ${error}`));
      continue;
    }

    if (animation.status !== "ready") {
      pending += 1;
      const reason = animation.statusReason ? ` — ${animation.statusReason}` : "";
      console.log(`PENDING  ${label} -> ${animation.sheet}${reason}`);
      continue;
    }

    checked += 1;
    const path = resolve(root, animation.sheet);

    try {
      const header = parsePngHeader(await readFile(path));
      const expected = expectedSheetSize(animation);

      if (header.width !== expected.width || header.height !== expected.height) {
        fail(
          `${label}: ${header.width}x${header.height}; expected ` +
          `${expected.width}x${expected.height}`
        );
      }

      if (header.colorType !== 6) {
        fail(`${label}: PNG color type ${header.colorType}; expected RGBA color type 6`);
      }

      if (header.bitDepth !== 8) {
        fail(`${label}: ${header.bitDepth}-bit channels; expected 8-bit RGBA`);
      }

      if (!failures) console.log(`READY  ${label} (${header.width}x${header.height} RGBA)`);
    } catch (error) {
      fail(`${label}: ${error.message}`);
    }
  }
}

console.log(`\nSprite validation: ${checked} ready, ${pending} pending, ${failures} failures.`);
if (failures) process.exitCode = 1;
