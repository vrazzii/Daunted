import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { constants, inflateSync } from "node:zlib";
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
  let interlace = 0;
  let sawIend = false;
  const idat = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) throw new Error(`${type || "PNG"} chunk exceeds file length`);

    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      interlace = buffer[dataStart + 12];
    } else if (type === "IDAT") {
      idat.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      sawIend = true;
      break;
    }
    offset = chunkEnd;
  }

  if (!sawIend) throw new Error("PNG is missing its IEND chunk");
  if (!width || !height || !idat.length) throw new Error("PNG is missing required image data");
  if (bitDepth !== 8 || colorType !== 6) throw new Error(`expected 8-bit RGBA, got depth=${bitDepth} colorType=${colorType}`);
  if (interlace !== 0) throw new Error("interlaced PNGs are not supported by the audit");

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const expectedInflatedBytes = height * (stride + 1);
  const compressed = Buffer.concat(idat);
  let inflated;
  let tolerantInflate = false;

  try {
    inflated = inflateSync(compressed);
  } catch (error) {
    // Browsers commonly tolerate a zlib stream whose final marker is imperfect as
    // long as the complete PNG scanline payload is present. Recover only when the
    // tolerant decode still yields every expected scanline byte.
    inflated = inflateSync(compressed, { finishFlush: constants.Z_SYNC_FLUSH });
    if (inflated.length < expectedInflatedBytes) throw error;
    tolerantInflate = true;
  }

  if (inflated.length < expectedInflatedBytes) {
    throw new Error(`decoded ${inflated.length} bytes; expected at least ${expectedInflatedBytes}`);
  }

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

  return { width, height, pixels, tolerantInflate };
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

  for (let y = 0; y < rect.height; y += 1) {
    for (let x = 0; x < rect.width; x += 1) {
      const alpha = sheet.pixels[((rect.y + y) * sheet.width + rect.x + x) * 4 + 3];
      if (alpha === 0) {
        transparent += 1;
        continue;
      }
      occupied += 1;
      if (x === 0 || y === 0 || x === rect.width - 1 || y === rect.height - 1) edgeOccupied += 1;
    }
  }

  const total = rect.width * rect.height;
  return {
    occupied,
    transparent,
    occupancy: total ? occupied / total : 0,
    edgeOccupied
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

    if (sheet.tolerantInflate) {
      warn(`${fighterId}/${animation.id}: PNG required tolerant zlib finalization; all scanline bytes were present`);
    }

    const seenSheetFrames = new Set();
    const emptyCells = [];
    const edgeCells = [];
    const opaqueCells = [];

    for (let logicalFrame = 0; logicalFrame < animation.frameCount; logicalFrame += 1) {
      const rect = frameSourceRect(animation, logicalFrame);
      if (seenSheetFrames.has(rect.sheetFrame)) continue;
      seenSheetFrames.add(rect.sheetFrame);
      frames += 1;
      const result = inspectFrame(sheet, rect);

      if (!result.occupied) {
        emptyCells.push(rect.sheetFrame);
        continue;
      }
      if (!result.transparent || result.occupancy > 0.94) {
        opaqueCells.push([rect.sheetFrame, result.occupancy]);
      }
      if (result.edgeOccupied > 8) {
        edgeCells.push([rect.sheetFrame, result.edgeOccupied]);
      }
    }

    const label = `${fighterId}/${animation.id}`;
    if (emptyCells.length) {
      const message = `${label}: transparent mapped cells [${emptyCells.join(", ")}]`;
      if (animation.category === "effect") warn(`${message}; allowed for sparse FX timing`);
      else fail(message);
    }

    if (opaqueCells.length) {
      const worst = opaqueCells.sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([cell, occupancy]) => `${cell}:${(occupancy * 100).toFixed(1)}%`).join(", ");
      warn(`${label}: ${opaqueCells.length} near-opaque cells (${worst}); inspect for baked backgrounds`);
    }

    if (edgeCells.length) {
      const worst = edgeCells.sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([cell, count]) => `${cell}:${count}`).join(", ");
      warn(`${label}: ${edgeCells.length} cells touch crop boundaries (${worst}); inspect for crop/neighbor contamination`);
    }
  }
}

console.log(`\nSprite alpha audit: ${frames} unique cells checked, ${warnings} warnings, ${failures} failures.`);
if (failures) process.exitCode = 1;
