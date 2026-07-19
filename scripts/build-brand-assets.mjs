#!/usr/bin/env node
/*
 * Derives every brand raster the site needs from the single source logo.
 *
 *   node scripts/build-brand-assets.mjs [path-to-source.png]
 *
 * Outputs:
 *   src/assets/monogram-mask.png   alpha mask, painted with --gold by CSS
 *   src/assets/wordmark-mask.png   alpha mask of the two-line wordmark
 *   public/favicon-32.png          browser tab icon
 *   public/apple-touch-icon.png    180px iOS home-screen icon
 *   public/og.png                  1200x630 social preview card
 *
 * The source art is gold-on-navy with a baked background. Dropping it into the
 * page directly would show a navy rectangle that never quite matches --bg.
 * Because the mark is a single bright hue on a dark field, luminance separates
 * artwork from background almost exactly, so we recover an alpha channel and
 * let CSS supply the colour. The logo then tracks the site's own tokens and
 * stays crisp at any size.
 *
 * This is an authoring tool run when the source logo changes, not part of
 * `npm run build`. Its outputs are committed.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decodePng, encodePng, createSurface, resample, blit } from './lib/png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2] ?? '/Users/flamarion/Downloads/fjconsulting.png';

// Brand colours, kept in sync with src/styles/tokens.css. sRGB here because
// these are baked rasters, not CSS.
const NAVY = [14, 20, 32];        // --bg
const GOLD = [217, 164, 65];      // --gold
const GOLD_HI = [243, 212, 136];  // --gold-hi

const img = decodePng(readFileSync(source));
const { width, height, channels, data } = img;
console.log(`source: ${source}`);
console.log(`        ${width}x${height}, ${channels} channels`);

const px = (x, y) => {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2]];
};
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// The source has a subtle vignette, so take the brightest corner as a
// conservative background level.
const bgLum = Math.max(
  ...[[4, 4], [width - 5, 4], [4, height - 5], [width - 5, height - 5]].map((p) =>
    lum(px(p[0], p[1])),
  ),
);
const THRESHOLD = bgLum + 26;

function bounds(x0, x1) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = x0; x < x1; x++) {
      if (lum(px(x, y)) > THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Render a region as white-on-transparent. Alpha is how far each pixel rose
 * above the background, which preserves the original anti-aliasing instead of
 * hard-thresholding the edges into jaggies.
 */
function toMask({ minX, minY, maxX, maxY }, pad = 2) {
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const w = Math.min(width, maxX + pad + 1) - x0;
  const h = Math.min(height, maxY + pad + 1) - y0;

  let peak = 0;
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) peak = Math.max(peak, lum(px(x, y)));
  const range = Math.max(1, peak - bgLum);

  const surface = createSurface(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = Math.round(
        Math.min(1, Math.max(0, (lum(px(x0 + x, y0 + y)) - bgLum) / range)) * 255,
      );
      const i = (y * w + x) * 4;
      surface.data[i] = 255;
      surface.data[i + 1] = 255;
      surface.data[i + 2] = 255;
      surface.data[i + 3] = a;
    }
  }
  return surface;
}

const full = bounds(0, width);

// The monogram is the left cluster and the wordmark follows after a clear
// gutter, so split on the widest ink-free column run inside the artwork.
const colHasInk = new Array(width).fill(false);
for (let x = full.minX; x <= full.maxX; x++) {
  for (let y = full.minY; y <= full.maxY; y++) {
    if (lum(px(x, y)) > THRESHOLD) { colHasInk[x] = true; break; }
  }
}
let gapStart = -1, gapLen = 0, runStart = -1;
for (let x = full.minX; x <= full.maxX; x++) {
  if (!colHasInk[x]) {
    if (runStart < 0) runStart = x;
  } else if (runStart >= 0) {
    if (x - runStart > gapLen) { gapLen = x - runStart; gapStart = runStart; }
    runStart = -1;
  }
}
const split = gapStart + Math.floor(gapLen / 2);
console.log(`        monogram/wordmark split at x=${split} (${gapLen}px gutter)`);

const monogram = toMask(bounds(full.minX, split));
const wordmark = toMask(bounds(split, full.maxX + 1));

mkdirSync(join(root, 'src/assets'), { recursive: true });
mkdirSync(join(root, 'public'), { recursive: true });

const write = (path, surface) => {
  writeFileSync(join(root, path), encodePng(surface.width, surface.height, surface.data));
  console.log(`  wrote ${path} (${surface.width}x${surface.height})`);
};

write('src/assets/monogram-mask.png', monogram);
write('src/assets/wordmark-mask.png', wordmark);

/* ---- favicons ----------------------------------------------------------- */

/**
 * Gold monogram on a navy square. Rendering the icon opaque rather than
 * transparent keeps it legible against both light and dark browser chrome.
 */
function icon(size) {
  const surface = createSurface(size, size, [...NAVY, 255]);
  // Leave roughly 16% breathing room so the mark is not clipped by the rounded
  // corners that iOS and some browsers apply.
  const inset = Math.round(size * 0.16);
  const box = size - inset * 2;
  const scale = Math.min(box / monogram.width, box / monogram.height);
  const w = Math.max(1, Math.round(monogram.width * scale));
  const h = Math.max(1, Math.round(monogram.height * scale));
  const mark = resample(monogram, w, h);
  blit(surface, mark, Math.round((size - w) / 2), Math.round((size - h) / 2), GOLD);
  return surface;
}

write('public/favicon-32.png', icon(32));
write('public/apple-touch-icon.png', icon(180));

/* ---- social preview card ------------------------------------------------ */

/**
 * 1200x630 is the size every major platform crops toward. The lockup sits
 * left-of-centre with generous margin so that aggressive centre-crops (which
 * some clients apply) still contain the mark.
 */
{
  const W = 1200;
  const H = 630;
  const card = createSurface(W, H, [...NAVY, 255]);

  // Build the lockup first so it can be centred as one unit rather than
  // positioned by eye.
  const markH = 176;
  const mark = resample(
    monogram,
    Math.round(monogram.width * (markH / monogram.height)),
    markH,
  );
  const wordW = 604;
  const word = resample(
    wordmark,
    wordW,
    Math.round((wordmark.height / wordmark.width) * wordW),
  );

  const gutter = 56;
  const lockupW = mark.width + gutter + word.width;
  const lockupH = Math.max(mark.height, word.height);
  const lockupX = Math.round((W - lockupW) / 2);
  // Sit fractionally above centre: optical centre reads lower than geometric.
  const lockupY = Math.round((H - lockupH) / 2) - 12;

  blit(card, mark, lockupX, lockupY + Math.round((lockupH - mark.height) / 2), GOLD);
  blit(
    card,
    word,
    lockupX + mark.width + gutter,
    lockupY + Math.round((lockupH - word.height) / 2),
    GOLD_HI,
  );

  // A gold bar along the bottom edge: the brand device, and the only place on
  // the card where the accent becomes a solid field.
  for (let y = H - 8; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      card.data[i] = GOLD[0];
      card.data[i + 1] = GOLD[1];
      card.data[i + 2] = GOLD[2];
    }
  }

  write('public/og.png', card);
}

console.log('\nBrand assets rebuilt.');
