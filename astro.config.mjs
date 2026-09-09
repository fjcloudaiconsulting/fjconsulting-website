// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Static output, no adapter, no SSR.
 *
 * The contact endpoint (Phase 3) is a standalone Cloudflare Pages Function under
 * functions/, which Cloudflare resolves separately from the static dist/ build.
 * Adding @astrojs/cloudflare here would switch the whole site to SSR and lose
 * the "pure static asset" deployment model, so it stays out deliberately.
 *
 * SITE_URL is injected per environment by CI so canonical URLs, the sitemap and
 * Open Graph tags point at the host actually serving the build.
 */
const site = process.env.SITE_URL ?? 'https://fjconsulting.dev';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // One stylesheet rather than several small ones: the whole site is a single
    // page, so per-component splitting only adds requests.
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
