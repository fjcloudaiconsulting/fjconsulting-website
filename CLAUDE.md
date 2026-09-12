# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- **Never co-author PRs, and never mention co-authoring in PRs or PR comments.**
  Do not add `Co-Authored-By` trailers to commits, and do not add "Generated with
  Claude Code" (or any similar authorship/attribution) lines to PR descriptions or
  comments. Commits and PRs are authored solely by the repository owner.
- **Every change goes through a PR. Never merge a PR** — the repository owner
  merges, and only after he explicitly says so. Do not merge, auto-merge, or push
  directly to `main`. Open the PR and wait.
- **Versioning: Semantic Versioning + Conventional Commits.** Commit messages and
  PR titles follow [Conventional Commits](https://www.conventionalcommits.org)
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, …); releases are tagged with
  [SemVer](https://semver.org) (`vMAJOR.MINOR.PATCH`), where the commit types
  determine the bump (`fix` → patch, `feat` → minor, `!`/`BREAKING CHANGE` → major).

## Project intention

Marketing website for **FJ Cloud & AI Consulting** — a Netherlands-based cloud,
Kubernetes, and AI-infrastructure consultancy that currently has no web presence.
The goal is a **simple, professional single-page site**, built to be fast and cheap
to run, and **improved incrementally**. Do not over-build; ship small, iterate.
The site itself doubles as a live demo of the company's Cloud/IaC practice.

## Stack & architecture

- **Astro** — static single-page site (`output: 'static'`, default `dist/`). **No
  `@astrojs/cloudflare` adapter and no SSR.** The contact endpoint (later) is a
  standalone Cloudflare Pages Function under `functions/`, which coexists with the
  static `dist/` build.
- **Cloudflare Pages** — hosting. Every deploy is served at a free `*.pages.dev`
  URL, so the site never depends on DNS to go live. Custom domain is attached later.
- **GitHub Actions** — builds Astro and deploys via `cloudflare/wrangler-action@v4`
  (`wrangler pages deploy dist`). GitHub Actions owns **deployments**.
- **Terraform Cloud** (VCS-driven workspace, working dir `infra/`) — manages the
  Cloudflare zone, DNS, and Pages custom-domain binding. The Pages project is
  created by the deploy workflow's "Ensure the Pages project exists" step, then
  **imported** into Terraform; Terraform owns **project config**, not creation
  (avoids a create/create collision).
- **Domain:** `fjconsulting.dev` (the `.io` domain is intentionally left untouched —
  it hosts unrelated production services). `.dev` is HSTS-preloaded (HTTPS-only);
  Cloudflare Pages serves valid HTTPS automatically, and local dev uses
  `http://localhost:4321` (exempt from HSTS).

## Phased delivery

1. ✅ **Phase 1 — Site live.** Full brand + content. Shipped.
2. ✅ **Phase 2 — IaC + custom domain.** Terraform Cloud manages DNS, the Pages
   custom domain and zone settings. **Live at `https://fjconsulting.dev`** (apex
   only) since 2026-09-12.
3. ⏳ **Phase 3 — Contact form.** Pages Function → Mailgun, plus Cloudflare
   Turnstile + honeypot spam protection. Email destination/sending domain TBD.
   Until then the contact section offers a direct `mailto:` and no form: the
   markup, the honeypot and the endpoint that reads them land together.

## Repository layout

```
/                    Astro site (src/, public/, astro.config.mjs, package.json)
functions/api/       Cloudflare Pages Function for contact (Phase 3)
infra/               Terraform (DNS, Pages custom domain, zone settings)
.github/workflows/   ci.yml, deploy.yml (reusable), deploy-dev.yml, terraform.yml
docs/                design spec, project status
```

## Brand (from the logo)

Navy `#131A2B` background (deeper `#0E1420` for depth), gold gradient accent
`#F3D488 → #D9A441`, white text `#F5F7FA`, muted `#9AA4B8`. Dark theme, premium /
senior-consulting feel.

The brand rasters (`public/og.png`, the favicons, the logo masks in `src/assets/`)
are committed and nothing in the build regenerates them. The generator was removed
in PR #8 — it carried its own PNG codec and its source logo no longer exists on
disk. To change the logo, regenerate them with `sharp` (already an Astro
dependency); the deleted script is in git history for reference.

## Development commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## Secrets

Never commit secrets. CI reads `CLOUDFLARE_API_TOKEN` (scope: Cloudflare Pages:
Edit) and `CLOUDFLARE_ACCOUNT_ID` from GitHub repo secrets. Terraform reads
Cloudflare credentials from Terraform Cloud workspace variables (sensitive).
Mailgun key (Phase 3) is stored as a Cloudflare/TFC secret.

## References

- **Design spec (source of truth for the design):** `docs/superpowers/specs/2026-07-14-fjconsulting-website-design.md`
- **Project status (where we left off — read first on resume):** `docs/PROJECT_STATUS.md`
- **Repo:** `git@github.com:fjcloudaiconsulting/fjconsulting-website.git`

## Company data

FJ Cloud & AI Consulting · KvK 42010737 · BTW NL005431862B54 ·
Baak van Camperduin 42, 3826 GH Amersfoort, NL · info@fjconsulting.io
