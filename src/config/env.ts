/**
 * Per-environment build configuration.
 *
 * Both values are read at build time and baked into the static output, so a
 * given deployment is only ever addressed as the host that actually serves it.
 */

/** The origin this build will be served from. Set by CI per environment. */
export const siteUrl = (
  import.meta.env.SITE_URL ??
  process.env.SITE_URL ??
  'https://www.fjconsulting.dev'
).replace(/\/$/, '');

/**
 * Whether search engines may index this deployment.
 *
 * Defaults to false, and only the production workflow sets it true. The dev
 * site and every branch preview therefore ship `noindex` by default, which
 * keeps fjconsulting.dev from competing with the real site for the company's
 * own name. CI asserts that a production build actually came out indexable, so
 * the safe default cannot silently suppress production.
 */
export const indexable =
  (import.meta.env.SITE_INDEXABLE ?? process.env.SITE_INDEXABLE) === 'true';
