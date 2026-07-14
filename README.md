# FJ Cloud & AI Consulting — Website

Marketing website for **FJ Cloud & AI Consulting** — a single-page site covering
services, company information, and contact. Built to be simple, fast, and cheap
to run, and improved incrementally.

> **Status:** Design approved and validated. Phase 1 (the site build) has not
> started yet. See [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for exactly
> where things stand and what's next.

## Tech stack

| Concern            | Choice                                                        |
| ------------------ | ------------------------------------------------------------- |
| Site generator     | [Astro](https://astro.build) — static output, ~zero JS       |
| Hosting            | [Cloudflare Pages](https://pages.cloudflare.com)              |
| Contact form       | Cloudflare Pages Function → Mailgun *(deferred, Phase 3)*     |
| Infrastructure     | [Terraform Cloud](https://app.terraform.io) (VCS-driven)     |
| CI/CD              | GitHub Actions → `wrangler pages deploy`                      |
| Domain             | `fjconsulting.dev` (via Cloudflare)                           |

## Architecture at a glance

- **Astro** builds a static single-page site to `dist/`. No SSR adapter.
- **GitHub Actions** builds and deploys to **Cloudflare Pages** on push to `main`.
  Every deploy is served immediately at a free `*.pages.dev` URL.
- **Terraform Cloud** manages the Cloudflare zone, DNS, and Pages custom-domain
  binding. The Pages project is created by the first `wrangler` deploy and then
  *imported* into Terraform (Terraform owns config; Actions owns deployments).
- The **contact form** posts to a standalone Pages Function under `functions/`,
  which relays to Mailgun. This is deferred until later.

## Phased delivery

1. **Phase 1 — Site live on `*.pages.dev`.** Full brand + content, contact-form
   UI (delivery stubbed). No DNS or email dependency. *First deliverable.*
2. **Phase 2 — IaC + custom domain.** Terraform Cloud provisions the Cloudflare
   zone/DNS and binds `fjconsulting.dev`.
3. **Phase 3 — Contact form delivery.** Wire the Pages Function to Mailgun and
   add spam protection (Cloudflare Turnstile + honeypot).

## Planned repository layout

```
/                    Astro site (src/, public/, astro.config.mjs, package.json)
functions/api/       Cloudflare Pages Function for contact (Phase 3)
infra/               Terraform (Cloudflare zone, DNS, Pages project) (Phase 2)
.github/workflows/   deploy.yml (build + deploy to Pages)
docs/                design spec, project status
```

## Local development *(once the site is scaffolded in Phase 1)*

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## Documentation

- **Design spec:** [`docs/superpowers/specs/2026-07-14-fjconsulting-website-design.md`](docs/superpowers/specs/2026-07-14-fjconsulting-website-design.md)
- **Project status / where we left off:** [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
