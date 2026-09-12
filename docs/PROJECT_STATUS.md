# Project Status — FJ Cloud & AI Consulting Website

_Last updated: 2026-09-09_

Single source of truth for **where we left off**. Update it at the end of each
working session.

## Current status

- ✅ Requirements, design spec, repo rules and conventions on `main` (PRs #1, #2 merged).
- ✅ **`fjconsulting.dev` zone is live on Cloudflare.** The transfer completed.
- ✅ **Phase 1 built.** Astro static site, full brand, all sections, contact-form
  UI with delivery stubbed. Verified across 320–1600px, WCAG 2.2 AA contrast
  asserted in CI.
- ✅ **CI/CD built.** Reusable deploy workflow, dev on merge to `main`,
  production on SemVer tag.
- ✅ **Phase 2 IaC written.** Terraform Cloud config for the `.dev` estate,
  validated against Cloudflare provider 5.22.
- ⏳ **Not yet deployed.** Blocked only on repository secrets (see below).
- ⏳ Phase 3 (contact delivery via Mailgun + Turnstile) not started.

**Domain decision (2026-09-09):** the first published version lives on the
`fjconsulting.dev` **apex**. The `dev.` subdomain is deliberately not bound: it
served a byte-identical copy of the apex, and the name is more useful pointed at
something else. `www` is dropped. `.dev` remains non-production and keeps `noindex` +
`Disallow`, so the site is live and shareable by link without competing with the
future production site for the company's own name. `fjconsulting.io` is
untouched and stays a separate, later exercise.

## Blocking: what the owner must do

Nothing ships until these exist. Everything else is ready.

### 1. GitHub repository secrets (blocks the first deploy)

- [ ] `CLOUDFLARE_API_TOKEN` — token `fjconsulting-website-github-actions`,
      scope **Account → Cloudflare Pages: Edit**
- [ ] `CLOUDFLARE_ACCOUNT_ID` — Cloudflare dashboard, right sidebar

### 2. GitHub Environments

- [ ] Create environment `dev` (no protection needed)
- [ ] `prod` is not needed yet. Create it, with a **required reviewer**
      protection rule, only when `fjconsulting.io` is ready to be released to.

### 3. Terraform Cloud (blocks the custom domain, not the site)

- [ ] VCS-driven workspace connected to this repo, working directory `infra/`
- [x] Org/workspace confirmed: organization `FlamaCorp`, workspace
      `fjconsulting-website` (the org guess of `fjconsulting` was wrong)
- [ ] Workspace variable `account_id` (Terraform variable)
- [ ] Workspace variable `CLOUDFLARE_API_TOKEN` (environment, **sensitive**) —
      token `fjconsulting-website-terraform-cloud`, needs **Account: Pages
      Edit**, **Zone: DNS Edit**, **Zone: Zone Read** and **Zone: Zone Settings
      Edit**. See the token table in `infra/README.md`.

## Order of operations for going live

1. Add the two GitHub secrets.
2. Merge this PR. `deploy-dev.yml` runs, creates the `fjconsulting-website-dev`
   Pages project if missing, deploys, site is live on `*.pages.dev`.
3. Connect the Terraform Cloud workspace and apply. `fjconsulting.dev` and
   starts serving.
4. Review the live site, correct the drafted copy.

Production is deliberately not part of this sequence, and no production
pipeline exists yet. The whole estate is the `.dev` zone until `fjconsulting.io`
moves to Cloudflare; the prod workflow is written then, against the environment
it actually deploys to.

## Environments and promotion

| | dev | prod (planned) |
| --- | --- | --- |
| Domain | `fjconsulting.dev` | `fjconsulting.io` |
| Pages project | `fjconsulting-website-dev` | `fjconsulting-website-prod` |
| Trigger | push to `main` | push a `v*.*.*` tag |
| Indexable | no (`noindex` + `Disallow`) | yes |

Only the dev column exists today. The prod column is the intended shape, not
shipped configuration.

**Planned promotion model: tag-triggered.** `main` flows continuously to dev. A
release is the deliberate act of tagging a commit that has already been running
there, and the prod workflow should refuse tags on commits that are not
ancestors of `main`.

Note: dev and prod are to be **rebuilt from the same commit** rather than
promoting one binary artifact. Canonical URLs, Open Graph tags and `robots.txt`
all carry the origin, so the artifact is genuinely environment-specific. The
commit is the unit promoted, and the tag records exactly which one.

## Reusability for future apps

`fjconsulting.dev` is the shared non-production estate. Onboarding a new app is:

1. Copy the `cloudflare_pages_domain` / `cloudflare_dns_record` pair in
   `infra/main.tf` for its hostname.
2. Copy `.github/workflows/deploy-dev.yml`, change the three inputs.
3. First CI run creates the Pages project; Terraform attaches the domain.

## Verification in CI

| Check | What it catches |
| --- | --- |
| `scripts/check-contrast.mjs` | A palette change that drops text below WCAG 2.2 AA |
| `scripts/check-build.mjs` | Blank-page regressions, wrong-environment URLs, prod shipping `noindex` |
| `astro check` | Type errors |
| Post-deploy smoke test | A deploy that succeeded but does not actually serve the site |
| `terraform fmt` / `validate` | Infra syntax, before the TFC run is queued |

## Conventions

- **Semantic Versioning**; commits and PR titles follow **Conventional Commits**
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `ci:`).
- Releases tagged `vMAJOR.MINOR.PATCH`: `fix` → patch, `feat` → minor,
  `!` / `BREAKING CHANGE` → major.
- **Every change goes through a PR.** The owner is the only one who merges.

## Backlog

**Next up**
- [ ] Replace drafted About copy with Flamarion's real background (biggest
      credibility win available; everything else is polish)
- [ ] Phase 3: contact form (Pages Function → Mailgun, Turnstile + honeypot).
      The contact section currently offers a direct `mailto:` and no form; the
      form markup, the honeypot and the endpoint that reads them all land
      together, so nothing ships that cannot be used
- [ ] Decide Mailgun sending domain and destination inbox

**Later**
- [ ] Lighthouse CI budget in the pipeline
- [ ] Preview deployments for pull requests (branch previews on the dev project)
- [ ] Rollback runbook (Cloudflare keeps prior deployments; document promoting one)
- [ ] Analytics, if wanted. Cloudflare Web Analytics is cookie-free and needs no
      consent banner
- [ ] Confirm the six service descriptions against real engagement history
- [ ] `security.txt`, and a plain-language privacy note once the form collects data

## Key decisions (locked)

| Topic | Decision |
| --- | --- |
| Generator | Astro 7, static output, **no** CF adapter / SSR |
| Hosting | Cloudflare Pages, two projects (dev + prod) |
| IaC | Terraform Cloud, VCS-driven |
| CI/CD | GitHub Actions, reusable `deploy.yml` called per environment |
| Promotion | main → dev automatically; SemVer tag → prod |
| Domains | `.dev` = shared non-prod estate (apex + `dev.`, no `www`), `.io` = production |
| Fonts | Archivo Variable + IBM Plex Mono, self-hosted, 50KB |
| Contact form | UI only in v1, Mailgun in Phase 3 |
| Indexing | Only production is indexable; dev ships `noindex` |
