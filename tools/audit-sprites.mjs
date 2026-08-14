import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { ANIMATION_LIBRARY } from "../src/data/animation-library.js";
import { frameSourceRect } from "../src/core/animation.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const cache = new Map();
let failures = 0;
let warnings = 0;
let frames = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`WARN  ${message}`);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodeRgbaPng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("invalid PNG signature");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      const interlace = buffer[dataStart + 12];
      if (interlace !== 0) throw new Error("interlaced PNGs are not supported by the audit");
    } else if (type === "IDAT") {
      idat.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  if (bitDepth !== 8 || colorType !== 6) throw new Error(`expected 8-bit RGBA, got depth=${bitDepth} colorType=${colorType}`);
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let source = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source++];
    const rowStart = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[source++];
      const left = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[rowStart + x - stride] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[rowStart + x - stride - bytesPerPixel] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paeth(left, up, upLeft);
      else throw new Error(`unsupported PNG filter ${filter}`);
      pixels[rowStart + x] = value & 255;
    }
  }

  return { width, height, pixels };
}

async function loadSheet(path) {
  if (!cache.has(path)) {
    const buffer = await readFile(resolve(root, path));
    cache.set(path, decodeRgbaPng(buffer));
  }
  return cache.get(path);
}

function inspectFrame(sheet, rect) {
  let occupied = 0;
  let transparent = 0;
  let edgeOccupied = 0;
  let minX = rect.width;
  let maxX = -1;
  let minY = rect.height;
  let maxY = -1;

  for (let y = 0; y < rect.height; y += 1) {
    for (let x = 0; x < rect.width; x += 1) {
      const alpha = sheet.pixels[((rect.y + y) * sheet.width + rect.x + x) * 4 + 3];
      if (alpha === 0) {
        transparent += 1;
        continue;
      }
      occupied += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      if (x === 0 || y === 0 || x === rect.width - 1 || y === rect.height - 1) edgeOccupied += 1;
    }
  }

  const total = rect.width * rect.height;
  return {
    occupied,
    transparent,
    occupancy: total ? occupied / total : 0,
    edgeOccupied,
    bounds: occupied ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null
  };
}

for (const [fighterId, animations] of Object.entries(ANIMATION_LIBRARY)) {
  for (const animation of Object.values(animations)) {
    if (animation.status !== "ready") continue;
    let sheet;
    try {
      sheet = await loadSheet(animation.sheet);
    } catch (error) {
      fail(`${fighterId}/${animation.id}: ${error.message}`);
      continue;
    }

    const seenSheetFrames = new Set();
    for (let logicalFrame = 0; logicalFrame < animation.frameCount; logicalFrame += 1) {
      const rect = frameSourceRect(animation, logicalFrame);
      if (seenSheetFrames.has(rect.sheetFrame)) continue;
      seenSheetFrames.add(rect.sheetFrame);
      frames += 1;
      const result = inspectFrame(sheet, rect);
      const label = `${fighterId}/${animation.id} cell ${rect.sheetFrame}`;

      if (!result.occupied) {
        fail(`${label}: cell is completely transparent`);
        continue;
      }

      if (!result.transparent || result.occupancy > 0.94) {
        warn(`${label}: ${(result.occupancy * 100).toFixed(1)}% opaque coverage; inspect for a baked background`);
      }

      if (result.edgeOccupied > 8) {
        warn(`${label}: ${result.edgeOccupied} nontransparent edge pixels; inspect for crop/neighbor contamination`);
      }
    }
  }
}

console.log(`\nSprite alpha audit: ${frames} unique cells checked, ${warnings} warnings, ${failures} failures.`);
if (failures) process.exitCode = 1;
