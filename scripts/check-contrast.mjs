#!/usr/bin/env node
/*
 * Verifies every foreground/background colour pair the site actually uses
 * against its WCAG 2.2 contrast requirement.
 *
 * Colours are read from src/styles/tokens.css so this cannot drift from the
 * real palette: change a token, and the assertion re-runs against the new value.
 * Runs in CI, so a palette tweak that breaks AA fails the build.
 *
 *   node scripts/check-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');

/* ---- token parsing ---------------------------------------------------- */

/** Pull `--name: oklch(...)` declarations from the :root block. */
function parseTokens(source) {
  const tokens = new Map();
  const re = /--([a-z0-9-]+):\s*(oklch\([^;]*\))\s*;/gi;
  let m;
  while ((m = re.exec(source)) !== null) {
    // Later declarations (e.g. inside prefers-contrast) intentionally overwrite
    // earlier ones only if we ask for them; keep the first (:root) definition.
    if (!tokens.has(m[1])) tokens.set(m[1], m[2].trim());
  }
  return tokens;
}

/** oklch(L C H) or oklch(L C H / A) -> {l, c, h, a} */
function parseOklch(value) {
  const inner = value.replace(/^oklch\(/i, '').replace(/\)$/, '').trim();
  const [coords, alphaPart] = inner.split('/').map((s) => s && s.trim());
  const [l, c, h] = coords.split(/\s+/).map(Number);
  const a = alphaPart === undefined ? 1 : Number(alphaPart);
  if ([l, c, h, a].some((n) => !Number.isFinite(n))) {
    throw new Error(`Unparseable oklch value: ${value}`);
  }
  return { l, c, h, a };
}

/* ---- colour maths ------------------------------------------------------ */

/** OKLCH -> linear-light sRGB. Björn Ottosson's Oklab matrices. */
function oklchToLinearSrgb({ l, c, h }) {
  const hRad = (h * Math.PI) / 180;
  const A = c * Math.cos(hRad);
  const B = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = l - 0.0894841775 * A - 1.291485548 * B;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return {
    r: 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    g: -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    b: -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  };
}

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Composite a possibly-translucent colour over an opaque backdrop, in linear
 * light. Hairline tokens are alpha, so this is required for a truthful result.
 */
function composite(fg, bg) {
  if (fg.a >= 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

/** WCAG relative luminance from linear-light sRGB. */
function luminance({ r, g, b }) {
  return (
    0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b)
  );
}

function contrast(fgLinear, bgLinear) {
  const a = luminance(fgLinear);
  const b = luminance(bgLinear);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---- the assertions ---------------------------------------------------- */

const tokens = parseTokens(css);

function color(name) {
  const raw = tokens.get(name);
  if (!raw) throw new Error(`Token --${name} not found in tokens.css`);
  const parsed = parseOklch(raw);
  return { ...oklchToLinearSrgb(parsed), a: parsed.a };
}

/**
 * Every pair below corresponds to a real combination rendered by the site.
 * `min` follows WCAG 2.2: 4.5 for body text, 3.0 for large text (>=24px, or
 * >=18.66px bold) and for non-text UI components and focus indicators.
 */
const PAIRS = [
  // Body and heading text on both surfaces.
  ['ink', 'bg', 4.5, 'primary text on page background'],
  ['ink', 'surface', 4.5, 'primary text on raised surface'],
  ['ink-muted', 'bg', 4.5, 'secondary prose on page background'],
  ['ink-muted', 'surface', 4.5, 'secondary prose on raised surface'],
  ['ink-faint', 'bg', 4.5, 'mono labels on page background'],
  ['ink-faint', 'surface', 4.5, 'mono labels on raised surface'],

  // Gold as text (section markers, links, the status dot label).
  ['gold', 'bg', 4.5, 'gold text on page background'],
  ['gold', 'surface', 4.5, 'gold text on raised surface'],
  ['gold-hi', 'bg', 4.5, 'bright gold text on page background'],

  // Gold as a fill: the navy ink sitting on the primary button.
  ['gold-ink', 'gold', 4.5, 'button label on gold fill'],

  // Non-text UI: focus ring and borders must clear 3:1 against what they
  // sit on, per WCAG 2.2 SC 1.4.11 and 2.4.11.
  ['gold', 'bg', 3, 'focus ring against page background'],
  ['gold', 'surface', 3, 'focus ring against raised surface'],
  ['line-strong', 'bg', 1.9, 'structural hairline against page background'],

  // The raised surface must be distinguishable from the page field.
  ['surface', 'bg', 1.15, 'raised surface against page background'],
];

let failed = 0;
const rows = [];

for (const [fgName, bgName, min, label] of PAIRS) {
  const bg = color(bgName);
  const fg = composite(color(fgName), bg);
  const ratio = contrast(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed++;
  rows.push({
    pass,
    text: `${pass ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(6)}:1  (min ${String(min).padStart(4)})  ${label}  [--${fgName} on --${bgName}]`,
  });
}

console.log('WCAG 2.2 contrast check — src/styles/tokens.css\n');
for (const row of rows) console.log('  ' + row.text);

if (failed > 0) {
  console.error(`\n${failed} contrast assertion(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${PAIRS.length} assertions passed.`);
