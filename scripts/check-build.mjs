#!/usr/bin/env node
/*
 * Asserts the built HTML is actually complete and correctly addressed.
 *
 * Two classes of regression this catches, both of which build cleanly and look
 * fine locally:
 *
 *  1. Empty-page regressions. The reveal animation hides content until JS
 *     confirms it can animate it back, so a mistake there ships a page that is
 *     blank to anything that does not run JS. Checking the copy is present in
 *     the static HTML is the guard.
 *  2. Wrong-environment URLs. Canonical and Open Graph URLs come from
 *     SITE_URL. If CI forgets to set it, the dev build would advertise itself
 *     as production (or the reverse) and split search-engine signals.
 *
 *   node scripts/check-build.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const indexPath = join(distDir, 'index.html');

const failures = [];
const check = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

if (!existsSync(indexPath)) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf8');

console.log('Built output checks — dist/\n');

/* ---- content is really in the HTML, not painted in by JS ---------------- */

const requiredCopy = [
  'Cloud, Kubernetes and AI infrastructure',
  'built as code',
  'Infrastructure as Code',
  'Kubernetes',
  'Private and sovereign cloud',
  'AI infrastructure',
  'ML tooling and MLOps',
  'How an engagement runs',
  'info@fjconsulting.io',
  '42010737',            // KvK
  'NL005431862B54',      // BTW-id
  'Amersfoort',
];

for (const snippet of requiredCopy) {
  check(`copy present: "${snippet}"`, html.includes(snippet));
}

/* ---- structure ---------------------------------------------------------- */

check('single <h1>', (html.match(/<h1[\s>]/g) ?? []).length === 1);
check('has <main> landmark', /<main[\s>]/.test(html));
check('has skip link', html.includes('skip-link'));
check('html lang is set', /<html[^>]+lang="[a-z-]+"/i.test(html));
check('structured data present', html.includes('application/ld+json'));
check(
  'structured data is valid JSON',
  (() => {
    const m = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    if (!m) return false;
    try {
      JSON.parse(m[1]);
      return true;
    } catch {
      return false;
    }
  })(),
);

/* ---- environment addressing --------------------------------------------- */

const expectedSite = process.env.SITE_URL;
if (expectedSite) {
  const origin = expectedSite.replace(/\/$/, '');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];

  check(
    'canonical points at SITE_URL',
    canonical?.startsWith(origin),
    `canonical=${canonical} expected prefix=${origin}`,
  );
  check('og:url points at SITE_URL', ogUrl?.startsWith(origin), `og:url=${ogUrl}`);
  check(
    'og:image is absolute and on SITE_URL',
    ogImage?.startsWith(`${origin}/`),
    `og:image=${ogImage}`,
  );
} else {
  console.log('  SKIP  SITE_URL not set, skipping environment URL checks');
}

/* ---- indexability matches the environment -------------------------------- */

// The safe default is noindex, so the risk worth guarding against is a
// production deploy that silently ships noindex and disappears from search.
const wantsIndexing = process.env.SITE_INDEXABLE === 'true';
const robotsMeta = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
const robotsTxt = existsSync(join(distDir, 'robots.txt'))
  ? readFileSync(join(distDir, 'robots.txt'), 'utf8')
  : '';

if (wantsIndexing) {
  check('production build is indexable', robotsMeta.includes('index') && !robotsMeta.includes('noindex'), `robots meta="${robotsMeta}"`);
  check('robots.txt allows crawling', robotsTxt.includes('Allow: /') && !robotsTxt.includes('Disallow: /'));
} else {
  check('non-production build is noindex', robotsMeta.includes('noindex'), `robots meta="${robotsMeta}"`);
  check('robots.txt disallows crawling', robotsTxt.includes('Disallow: /'));
}

/* ---- assets -------------------------------------------------------------- */

for (const asset of [
  'og.png',
  'favicon-32.png',
  'apple-touch-icon.png',
  'robots.txt',
  'fonts/archivo-latin-wght-normal.woff2',
  'fonts/ibm-plex-mono-latin-400-normal.woff2',
]) {
  check(`asset built: ${asset}`, existsSync(join(distDir, asset)));
}

/* ---- results ------------------------------------------------------------- */

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\nAll built-output checks passed.');
