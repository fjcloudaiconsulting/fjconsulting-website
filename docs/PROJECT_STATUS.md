# Project Status — FJ Cloud & AI Consulting Website

_Last updated: 2026-09-12_

Single source of truth for **where we left off**. Update it at the end of each
working session.

## Current status

- ✅ Requirements, design spec, repo rules and conventions on `main` (PRs #1, #2 merged).
- ✅ **`fjconsulting.dev` zone is live on Cloudflare.** The transfer completed.
- ✅ **Phase 1 built.** Astro static site, full brand, all sections. The contact
  section offers a direct `mailto:`; there is no form until Phase 3 can deliver
  one. Verified across 320–1600px, WCAG 2.2 AA contrast asserted in CI.
- ✅ **CI/CD built.** Reusable deploy workflow, dev on merge to `main`. No
  production pipeline yet; it is written when `fjconsulting.io` moves.
- ✅ **Phase 2 applied.** Terraform Cloud manages the apex DNS record, the Pages
  custom domain and the zone's email-obfuscation setting.
- ✅ **LIVE at https://fjconsulting.dev** (2026-09-12). Apex only, valid TLS,
  `noindex` + `Disallow` as intended. Unknown paths return a real 404.
- 🟡 **Phase 3 built, delivery dormant.** The form, the honeypot, the Turnstile
  mount and `functions/api/contact.js` are all shipped. The endpoint answers
  `503 not_configured` until the Mailgun credentials exist, and the page keeps a
  plain `mailto:` beside the form, so nothing on the live site is broken while it
  waits. Turning it on is credentials only — no further code. See
  **Blocked on the owner** below.

**Domain decision (2026-09-09):** the first published version lives on the
`fjconsulting.dev` **apex**. The `dev.` subdomain is deliberately not bound: it
served a byte-identical copy of the apex, and the name is more useful pointed at
something else. `www` is dropped. `.dev` remains non-production and keeps `noindex` +
`Disallow`, so the site is live and shareable by link without competing with the
future production site for the company's own name. `fjconsulting.io` is
untouched and stays a separate, later exercise.

## Setup, now complete

Kept as a record of what the live estate depends on.

- [x] GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
- [x] GitHub environment `dev`. `prod` deliberately not created; add it, with a
      required-reviewer rule, only when `fjconsulting.io` is ready
- [x] Terraform Cloud workspace `FlamaCorp/fjconsulting-website`, VCS-driven,
      working directory `infra/`, both variables set
- [x] Two Cloudflare API tokens, one per consumer. Names, permissions and the
      traps involved are documented in `infra/README.md`

Going live took, in order: the two GitHub secrets, merge to `main` to deploy,
then a manually queued Terraform run to bind the apex. `queue-all-runs` is off,
so the first run of any new workspace must be queued deliberately.

## Blocked on the owner

Everything below needs an account, a key or a fact that only the owner has.
Grouped so each block is one sitting; the blocks are independent except where
stated.

### A. Decide the Mailgun sending domain *(5 min, blocks B)*

Mailgun will not send from an address it has not verified, so a domain has to be
picked before anything else. The visitor's own address rides in `Reply-To`, so
this domain is only ever the envelope sender.

| Option | For | Against |
| --- | --- | --- |
| **`mg.fjconsulting.dev`** *(recommended)* | The zone is already on Cloudflare and Terraform-managed, so the DKIM/SPF records can be committed as code rather than clicked | Sends from the non-production domain |
| `mg.fjconsulting.io` | Matches the destination address and the long-term production identity | `.io` is not on Cloudflare; the records are manual at the current registrar, and `.io` is explicitly out of scope for now |
| Mailgun sandbox | Zero setup | Only delivers to addresses pre-authorised in Mailgun — fine to smoke-test, not to ship |

Note: this is the SPF question that was set aside earlier. It was correctly
deferred then; Mailgun makes it load-bearing now, because an unverified sending
domain simply will not deliver.

**Decide, then say which.** If it is `mg.fjconsulting.dev`, paste the DKIM value
Mailgun shows and the records get added to `infra/` as Terraform — no dashboard
clicking.

### B. Mailgun account and sending domain *(~20 min, plus DNS propagation)*

1. Create the Mailgun account. **Choose the EU region** — the company and its
   visitors are in the EU, and the code defaults to `api.eu.mailgun.net`. A
   US-region account needs `MAILGUN_API_BASE=https://api.mailgun.net/v3` set as
   well.
2. Add the sending domain chosen in A.
3. Add the DNS records Mailgun lists (SPF `TXT`, DKIM `TXT`, and the receiving
   `MX` pair). For `mg.fjconsulting.dev` this is a Terraform change — send the
   values rather than clicking.
4. Wait for Mailgun to show the domain as **Verified**.
5. Create a **Sending API key** (Mailgun → API keys). Keep it to hand for D.

### C. Cloudflare Turnstile widget *(~5 min, independent of A and B)*

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name it `fjconsulting-website`, hostname `fjconsulting.dev`, mode **Managed**.
3. Copy the **site key** and the **secret key**.
4. GitHub → repo **Settings → Secrets and variables → Actions → Variables** →
   new repository *variable* (not a secret) named `TURNSTILE_SITE_KEY`, value =
   the site key. It is public by design; it is rendered into the page.

The secret key goes in D. Until both exist the form still works — the honeypot
runs alone and the widget is simply not rendered.

### D. Cloudflare Pages secrets *(~5 min, needs B and C)*

Cloudflare dashboard → **Workers & Pages → `fjconsulting-website-dev` →
Settings → Variables and secrets**, scope **Production**:

| Name | Type | Value |
| --- | --- | --- |
| `MAILGUN_API_KEY` | Secret | The sending key from B5 |
| `MAILGUN_DOMAIN` | Text | The domain from A, e.g. `mg.fjconsulting.dev` |
| `CONTACT_TO` | Text | `info@fjconsulting.io` |
| `TURNSTILE_SECRET_KEY` | Secret | The secret key from C3 |
| `MAILGUN_API_BASE` | Text | **Only** if the Mailgun account is US-region |

**Then re-run the deploy.** Pages applies new variables to new deployments only,
so an existing deployment keeps answering `503` until GitHub Actions → *Deploy
dev* → **Run workflow** has run again.

Verify: submit the form on <https://fjconsulting.dev#contact>. A message should
arrive at `CONTACT_TO` with the visitor's address as `Reply-To`.

### E. Real About copy *(no accounts needed — the biggest credibility win left)*

The About section is currently drafted from the brief. Everything in it is true
but generic; none of it says who is behind the practice. Answering these turns it
into the section a hiring manager actually reads:

1. **Years and shape of experience.** How many years in infrastructure, and doing
   what — platform engineering, SRE, consulting, a mix?
2. **Where.** Which companies or sectors can be named publicly (telco, finance,
   research, public sector)? Names are strongest; "a Dutch bank" still beats
   nothing.
3. **Two or three engagements worth describing**, even anonymously: what was
   wrong, what was built, what changed. One sentence each.
4. **Scale markers.** Largest cluster or fleet run, biggest migration, GPU count
   — whatever is genuinely impressive and true.
5. **Credentials worth listing.** CKA/CKS, cloud certifications, OpenStack or
   CNCF involvement, talks, open-source contributions.
6. **Languages.** Dutch, English, Portuguese — it matters for EU engagements.
7. **Anything deliberately *not* done.** "I do not do Windows estates" reads as
   confidence, not limitation.

Bullet answers are enough; the copy gets written from them into
`src/data/site.ts`.

### F. Optional, when convenient

- **Merge PR #12** (CLAUDE.md documentation refresh, CI green, docs only).
- **Turnstile as Terraform.** The widget in C can be a `cloudflare_turnstile_widget`
  resource instead of a dashboard click. It was left out deliberately: it needs a
  fifth permission on the Terraform token, puts the secret key in state, and
  saves no manual step, because the key still has to be pasted into Pages. Say
  the word if the IaC completeness is worth more than that.

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
| `npm test` (`node --test`) | The contact function: validation, honeypot, Turnstile enforcement, Mailgun call shape, and every failure path |
| Post-deploy `POST /api/contact` | The Pages Function did not deploy at all — the page loads fine and only the form 404s, which nothing else notices |

## Conventions

- **Semantic Versioning**; commits and PR titles follow **Conventional Commits**
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `ci:`).
- Releases tagged `vMAJOR.MINOR.PATCH`: `fix` → patch, `feat` → minor,
  `!` / `BREAKING CHANGE` → major.
- **Every change goes through a PR.** The owner is the only one who merges.

## Backlog

**Next up** — all four are owner-blocked; see **Blocked on the owner** above
- [ ] Decide the Mailgun sending domain (blocks everything else in Phase 3)
- [ ] Mailgun account, verified domain, sending key
- [ ] Turnstile widget + the four Pages secrets, then re-run the deploy
- [ ] Replace drafted About copy with Flamarion's real background

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
| Contact form | Form + honeypot always on; Turnstile and Mailgun activate from environment variables, so the form ships before the credentials exist |
| Indexing | Only production is indexable; dev ships `noindex` |
