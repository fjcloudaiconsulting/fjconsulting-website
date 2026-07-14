# FJ Cloud & AI Consulting — Website Design Spec

**Date:** 2026-07-14
**Status:** Approved (design), pending implementation plan
**Author:** Flamarion Jorge + Claude

## Goal

Ship a simple, professional single-page marketing website for **FJ Cloud & AI
Consulting**, which currently has no web presence. Optimize for fast build and
deploy with minimal infrastructure. The site itself doubles as a live demo of
the company's Cloud/IaC practice. Improve incrementally — do not over-build.

## Non-goals (v1)

- No CMS, no blog, no multi-page routing.
- No authentication, no database.
- No analytics (can be added later).
- Contact-form email delivery is **deferred** (see Phase 3).

## Tech stack

- **Astro** — static single-page site (`output: 'static'`, default `dist/`), ships
  ~zero JS. **No `@astrojs/cloudflare` adapter and no SSR** — the contact endpoint
  is a standalone Pages Function in `functions/`, which coexists with the static
  `dist/` build (static assets and functions are resolved by separate mechanisms).
- **Cloudflare Pages** — hosting; free tier, git-push deploy, global CDN, auto HTTPS.
- **Cloudflare Pages Functions** — serverless endpoint for the contact form (Phase 3).
- **Terraform Cloud** (VCS-driven workspace) — provisions Cloudflare infra (Phase 2).
- **GitHub Actions** — builds Astro and deploys to Pages via `wrangler pages deploy`.

## Design system (derived from the logo)

Logo: "FJ Cloud & AI Consulting" — gold monogram + wordmark on deep navy.

- **Background:** navy `#131A2B`; deeper `#0E1420` for layered depth.
- **Accent:** gold gradient `#F3D488 → #D9A441` (headings, CTAs, monogram).
- **Text:** white `#F5F7FA` primary; muted `#9AA4B8` secondary.
- **Theme:** dark by default, gold accents. Premium / senior consulting feel.
- Logo used in nav + hero; gold favicon.
- Exact hex values to be sampled from the source PNG at scaffold time; values
  above are the design target.

Source logo file: `/Users/flamarion/Downloads/fjconsulting.png` (to be copied
into `public/` / `src/assets/` during implementation).

## Page structure (single-scroll, sticky nav)

```
Nav (logo + anchor links)
Hero        — tagline + primary CTA (scroll to contact)
Services    — 6 cards
About       — short blurb (placeholder, to personalize)
Company data — legal/registration details
Contact     — form UI (delivery deferred)
Footer      — company data + copyright
```

### Content

- **Hero tagline (draft):** "Cloud, Kubernetes & AI infrastructure — engineered
  as code, run with confidence." (editable)
- **Service cards:**
  1. **Infrastructure as Code** — Terraform/OpenTofu, Pulumi, reusable modules, GitOps
  2. **Kubernetes** — cluster design, platform engineering, Day-2 ops, ArgoCD/Flux
  3. **Cloud Infrastructure** — AWS · GCP · Azure, vendor-neutral multi-cloud architecture
  4. **Private Cloud / OpenStack** — on-prem & sovereign cloud, OpenStack deploy & ops
  5. **AI Infrastructure** — GPU clusters, training/inference platforms, scalable ML infra
  6. **ML/AI Tooling** — Weights & Biases and ClearML, experiment tracking, MLOps pipelines
- **About:** short placeholder blurb for the owner to personalize later.
- **Company data:**
  - Trade name: FJ Cloud & AI Consulting
  - KvK: 42010737
  - BTW-id: NL005431862B54
  - Address: Baak van Camperduin 42, 3826 GH Amersfoort, NL
  - Contact: info@fjconsulting.io

## Contact form

- v1: renders the form UI (name, email, message) so the layout is complete.
- Submission delivery is **disabled/stubbed** in v1 — the form either is
  visually present with a "coming soon" note, or posts to a stub that returns a
  friendly message. No Mailgun call yet.
- Phase 3 wires `POST /api/contact` (Pages Function) → Mailgun API, adds a
  honeypot field + Cloudflare Turnstile for spam protection. Email destination
  and Mailgun sending domain are TBD (owner is resolving separately).

## Domain & DNS

- Primary domain for this project: **fjconsulting.dev** (the `.io` domain is
  left untouched — it hosts unrelated production services).
- `.dev` is registered at **Leaseweb**. Cutover = change nameservers at Leaseweb
  to Cloudflare, one time, done by the owner.
- The site does **not** depend on DNS: it deploys to a free `*.pages.dev` URL
  immediately. The custom domain is attached later (Phase 2), so DNS issues
  never block shipping the site.
- Phase 2 sequencing: owner moves Leaseweb nameservers → Cloudflare zone goes
  active → Terraform binds the custom domain (`cloudflare_pages_domain`). The
  domain binding only validates once the zone is active.
- `.dev` is HSTS-preloaded (HTTPS-only). No impact in practice: Cloudflare Pages
  serves valid HTTPS for both `*.pages.dev` and the custom domain, and local dev
  runs on `http://localhost:4321` (exempt from HSTS). Just never map a `*.dev`
  hostname to a plain-HTTP local server.

## Repository layout

```
/                    Astro site (src/, public/, astro.config.mjs, package.json)
functions/api/       Cloudflare Pages Function for contact (Phase 3)
infra/               Terraform (Cloudflare zone, DNS, Pages project) (Phase 2)
.github/workflows/   deploy.yml (build + deploy to Pages)
docs/                specs and notes
```

## Secrets handling

- Cloudflare API token + Mailgun key are supplied by the owner, never committed.
- Terraform reads them from Terraform Cloud workspace variables (sensitive).
- GitHub Actions reads from repo secrets for `wrangler`:
  - `CLOUDFLARE_API_TOKEN` — scope must include **Cloudflare Pages: Edit** (a
    DNS-only token cannot deploy Pages).
  - `CLOUDFLARE_ACCOUNT_ID` — required for non-interactive `wrangler pages deploy`.
- The Pages **project name** is fixed up front (e.g. `fj-consulting`) and passed
  as `--project-name` in CI; the deploy also passes `--branch`.

## Pages project ownership (Phase 1 ↔ Phase 2 boundary)

To avoid a create/create collision:

- **Phase 1:** `wrangler pages deploy dist` auto-creates the Pages project (a
  "direct upload" project) on first run. GitHub Actions owns **deployments**.
- **Phase 2:** Terraform does **not** create the project — it `terraform import`s
  the already-existing project into state and owns **project configuration**
  (custom domain, settings). Deployments keep flowing from GitHub Actions.
- Recommended CI: the official `cloudflare/wrangler-action@v3` (run from repo
  root so `functions/` is discovered relative to CWD).

## Phasing

### Phase 1 — The site (no DNS, no email) — FIRST DELIVERABLE
Astro single-page site with full brand, all sections, contact-form UI (delivery
stubbed). GitHub Actions deploys to `*.pages.dev`. Live and shareable.

### Phase 2 — IaC + custom domain
Terraform Cloud (VCS-driven) manages the Cloudflare Pages project, the
`fjconsulting.dev` zone, DNS records, and custom-domain binding. Owner moves
nameservers at Leaseweb.

### Phase 3 — Contact form delivery
Wire Pages Function → Mailgun, add Turnstile + honeypot spam protection.

## Testing / verification

- `astro build` runs clean in CI.
- Visual check of the deployed `*.pages.dev` site (responsive: mobile + desktop).
- Lighthouse pass on the built site (performance/SEO/accessibility).
- Phase 2: `terraform validate` + `plan` clean.
- Phase 3: unit test for the contact function; end-to-end form submission test.

## Success criteria (v1 / Phase 1)

A visitor at the `*.pages.dev` URL sees a polished, on-brand single-page site
with the company's services, about, company registration data, and a contact
form UI — fast (good Lighthouse scores) and responsive on mobile and desktop.
