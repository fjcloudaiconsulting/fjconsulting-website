# FJ Cloud & AI Consulting — Website

Marketing website for **FJ Cloud & AI Consulting**: a single-page site covering
services, company information, and contact. Built to be simple, fast, and cheap
to run, and improved incrementally.

The site doubles as a working demonstration of the practice it sells. It is
statically built, provisioned as code, deployed by CI, and verified for contrast
and completeness on every commit.

> **Status:** live at <https://fjconsulting.dev>. Phases 1 and 2 are done. The
> Phase 3 contact endpoint is built and deployed but dormant: it answers
> `503 not_configured` until the Mailgun credentials are set, and the page keeps
> a plain `mailto:` beside the form meanwhile. See
> [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for the exact steps left.

## Tech stack

| Concern | Choice |
| --- | --- |
| Site generator | [Astro](https://astro.build) 7, static output, no SSR adapter |
| Styling | Hand-authored CSS, OKLCH tokens, no framework |
| Fonts | Archivo Variable + IBM Plex Mono, self-hosted, ~50KB |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com), one project per environment |
| Infrastructure | [Terraform Cloud](https://app.terraform.io), VCS-driven |
| CI/CD | GitHub Actions, reusable workflow called per environment |
| Contact form | Cloudflare Pages Function → Mailgun, Turnstile + honeypot |

## Environments

| | dev | prod |
| --- | --- | --- |
| Domain | `fjconsulting.dev` | `fjconsulting.io` |
| Trigger | push to `main` | push a `v*.*.*` tag |
| Indexable | no | yes |

`fjconsulting.dev` is the shared non-production estate for everything, not just
the apex serves this project; future apps get their own subdomain and reuse the
same Terraform resource pair and deploy workflow. There is no `www` host: the apex is the canonical origin.

Promotion is planned as **tag-triggered**: `main` flows continuously to dev, and
a release is the deliberate act of tagging a commit already running there. Only
the dev half exists today — the production workflow is written when
`fjconsulting.io` moves to Cloudflare, against the environment it deploys to.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-check + build to dist/
npm run preview  # serve the production build
```

### Verification

```bash
npm test                          # node:test fences over the contact function
node scripts/check-contrast.mjs   # WCAG 2.2 AA assertions over the colour tokens
node scripts/check-build.mjs      # built HTML is complete and correctly addressed
npm run check                     # all three, plus the build
```

All three run in CI. The contrast check reads `src/styles/tokens.css` directly,
so it cannot drift from the real palette. The deploy workflow additionally POSTs
an empty body to `/api/contact` and requires a 400, which is the only thing that
proves the Pages Function actually deployed rather than silently 404ing.

### The contact endpoint

`functions/api/contact.js` is deployed by Cloudflare alongside `dist/`; it is not
part of the Astro build. To run it locally against the real Workers runtime:

```bash
npm run build
npx wrangler pages dev dist          # http://localhost:8788
```

Put local secrets in `.dev.vars` (gitignored) to exercise delivery:

| Variable | Required | Notes |
| --- | --- | --- |
| `MAILGUN_API_KEY` | yes | Secret. |
| `MAILGUN_DOMAIN` | yes | The verified Mailgun sending domain. |
| `CONTACT_TO` | yes | Destination inbox. |
| `MAILGUN_API_BASE` | no | Defaults to the EU region; a US-region domain needs `https://api.mailgun.net/v3`. |
| `TURNSTILE_SECRET_KEY` | no | When unset, the challenge is not enforced and the honeypot is the only guard. |

The public Turnstile site key is a build-time value, not a secret: it is the
GitHub repository variable `TURNSTILE_SITE_KEY`, baked in as
`PUBLIC_TURNSTILE_SITE_KEY`.

### Brand assets

`public/og.png`, the favicons and the logo masks are all derived from one source
logo and committed, so nothing in the build regenerates them.

The generator that produced them has been removed: it carried its own 215-line
PNG codec, and its source logo no longer exists on disk, so it could not be run
or verified. When the logo next changes, regenerate the masks and rasters with
`sharp` (already present as an Astro dependency) — roughly forty lines. The
previous implementation is in git history if it is wanted as a reference.

## Repository layout

```
/                     Astro site (src/, public/, astro.config.mjs)
src/data/site.ts      All site copy, in one file
src/styles/tokens.css Design tokens (colour, type, spacing, motion)
scripts/              Build and accessibility verification
infra/                Terraform: DNS and Pages custom domains
functions/api/        Cloudflare Pages Function for contact
.github/workflows/    CI, reusable deploy, dev caller, terraform
docs/                 Design spec and project status
```

## Editing content

Copy lives in [`src/data/site.ts`](src/data/site.ts), not scattered through
components. Headline, services, approach, about and contact text can all be
changed there without touching markup.

## Documentation

- **What this is and who it is for:** [`PRODUCT.md`](PRODUCT.md)
- **How it looks and why:** [`DESIGN.md`](DESIGN.md)
- **Infrastructure and ownership split:** [`infra/README.md`](infra/README.md)
- **Where we left off, and the backlog:** [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
- **Original design spec:** [`docs/superpowers/specs/2026-07-14-fjconsulting-website-design.md`](docs/superpowers/specs/2026-07-14-fjconsulting-website-design.md)
