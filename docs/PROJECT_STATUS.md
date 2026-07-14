# Project Status — FJ Cloud & AI Consulting Website

_Last updated: 2026-07-14_

This file is the single source of truth for **where we left off**. Update it at
the end of each working session.

## Current status

- ✅ Requirements gathered and design approved (brainstorming).
- ✅ Design spec written, architect-validated, and committed:
  `docs/superpowers/specs/2026-07-14-fjconsulting-website-design.md`.
- ✅ README + this status doc added.
- 🔄 **Domain transfer in progress** — `fjconsulting.dev` moved to Cloudflare;
  waiting for the nameserver takeover to propagate and the zone to go active.
- ⏳ **Phase 1 site build not started** — next step once we resume.

## Next step (when we resume)

1. Confirm the Cloudflare zone for `fjconsulting.dev` is **active**.
2. Produce the **Phase 1 implementation plan** (writing-plans skill).
3. Build the Astro single-page site → deploy to `*.pages.dev`.

## Conventions

- **Semantic Versioning** is adopted for commits, PRs, and releases.
  - Commit messages and PR titles follow **Conventional Commits**
    (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `ci:`, …).
  - Releases are tagged **`vMAJOR.MINOR.PATCH`** ([SemVer](https://semver.org)):
    `fix` → patch, `feat` → minor, `!` / `BREAKING CHANGE` → major.
- **Every change goes through a PR.** The owner is the only one who merges, and
  only after explicit approval. No direct pushes to `main`, no auto-merge.

## Key decisions (locked)

| Topic          | Decision                                                             |
| -------------- | ------------------------------------------------------------------- |
| Generator      | Astro, static output, **no** CF adapter / SSR                       |
| Hosting        | Cloudflare Pages (`*.pages.dev` first, custom domain later)         |
| IaC            | Terraform Cloud, **VCS-driven** workspace                           |
| CI/CD          | GitHub Actions + `cloudflare/wrangler-action@v3`                    |
| Domain         | `fjconsulting.dev` (`.io` left untouched — hosts unrelated prod)    |
| Contact form   | Pages Function → Mailgun, **deferred to Phase 3**                   |
| Brand          | Navy `#131A2B` + gold `#F3D488→#D9A441`, dark theme                 |
| Pages project  | Created by first `wrangler` deploy, later **imported** into TF      |

## What the owner can do now to expedite

These unblock Phase 1 CI and Phase 2 IaC. None are required to *start* the build,
but having them ready removes wait time later.

### For Phase 1 (deploy to `*.pages.dev`)
- [ ] Create a **Cloudflare API token** scoped to **Account → Cloudflare Pages: Edit**.
- [ ] Grab the **Cloudflare Account ID** (Cloudflare dashboard → right sidebar).
- [ ] Decide the **Pages project name** (proposed: `fj-consulting`).
- [ ] Add GitHub repo secrets:
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`

### For Phase 2 (Terraform Cloud + custom domain)
- [ ] Create a **Terraform Cloud workspace** (VCS-driven), connected to this repo,
      with working directory `infra/`.
- [ ] Add a **broader Cloudflare API token** to the TFC workspace as a *sensitive*
      variable — scope: **Zone: DNS Edit**, **Account → Cloudflare Pages: Edit**,
      and **Zone: Zone Read/Edit** for `fjconsulting.dev`.
- [ ] Confirm the `fjconsulting.dev` zone is **active** in Cloudflare (post-transfer).

### For Phase 3 (contact form — later, no action needed yet)
- [ ] Decide the destination inbox (e.g. `info@fjconsulting.io`) and Mailgun sending domain.
- [ ] Have the **Mailgun API key** ready (stored as a Cloudflare/TFC secret, never committed).

## Content still to finalize (can be placeholders at first)
- [ ] Hero tagline (draft exists in spec) — keep or replace.
- [ ] About blurb — personalize or approve the drafted placeholder.
- [ ] Confirm the 6 service cards' wording.
