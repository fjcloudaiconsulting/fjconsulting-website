# Infrastructure

Terraform for the Cloudflare side of the website: which hostnames exist, and
which Cloudflare Pages project each one points at.

Managed from a **Terraform Cloud VCS-driven workspace** with working directory
`infra/`. State and credentials live there; nothing sensitive is in this repo.

## Ownership split

This is the part that keeps CI and Terraform from fighting over the same
objects:

| Thing | Owned by |
| --- | --- |
| Cloudflare Pages **project** (creation) | `wrangler pages deploy` on the first CI run |
| **Deployments** (every build that ships) | GitHub Actions |
| Custom **domains** and **DNS** | Terraform (this directory) |
| Zone lifecycle (the domain itself) | Nobody. Looked up, never created or destroyed. |

Terraform deliberately does not declare `cloudflare_pages_project`. If it did,
both CI and Terraform would try to create the project and one of them would
fail. Instead the deploy workflow creates it (an idempotent "Ensure the Pages
project exists" step, because `wrangler pages deploy` will not create a missing
project without a TTY), and Terraform attaches domains to it.

## Environments

| Environment | Zone | Pages project | Hostnames |
| --- | --- | --- | --- |
| dev | `fjconsulting.dev` | `fjconsulting-website-dev` | `fjconsulting.dev`, `dev.fjconsulting.dev` |
| prod | `fjconsulting.io` | `fjconsulting-website-prod` | `fjconsulting.io`, `www.fjconsulting.io` |

Production is gated behind `enable_prod`, which defaults to `false`. The `.io`
domain still hosts unrelated production services and has not been moved to
Cloudflare. Nothing here touches it until that flag is deliberately flipped.

## The reusable module

`modules/pages-app/` binds a set of hostnames to an existing Pages project and
creates the proxied CNAME records. It is the unit every future app under
`fjconsulting.dev` should use:

```hcl
module "some_new_app" {
  source = "./modules/pages-app"

  account_id   = var.account_id
  zone_id      = data.cloudflare_zone.dev.zone_id
  project_name = "some-new-app-dev"
  hostnames    = ["someapp.fjconsulting.dev"]
  environment  = "dev"
}
```

Onboarding a new app is then: add the module block here, copy
`.github/workflows/deploy-dev.yml` with new inputs, and let the first CI run
create the Pages project.

## First run

Ordering matters, because Terraform attaches domains to a project that must
already exist:

1. Merge to `main` so `deploy-dev.yml` runs. The workflow creates the
   `fjconsulting-website-dev` Pages project if it is missing, then deploys, and
   the site goes live on `*.pages.dev`.
2. Confirm the Terraform Cloud workspace is connected to this repo with working
   directory `infra/`, and that these workspace variables are set:
   - `account_id` (Terraform variable) — the Cloudflare account ID
   - `CLOUDFLARE_API_TOKEN` (environment variable, **sensitive**)
3. Let the VCS-driven plan run and apply it. DNS and the custom domain binding
   appear, and `fjconsulting.dev` starts serving.

The Cloudflare API token for Terraform needs **Zone: DNS Edit**, **Zone: Zone
Read**, and **Account: Cloudflare Pages Edit**. The token CI uses is narrower:
**Account: Cloudflare Pages Edit** only.

## Local checks

No credentials required, and no state is touched:

```bash
terraform -chdir=infra fmt -recursive -check -diff
terraform -chdir=infra init -backend=false
terraform -chdir=infra validate
```

Plan and apply are intentionally not run locally. Terraform Cloud is the only
thing that should hold state.

## Terraform Cloud

The `cloud` block in `main.tf` points at organization `FlamaCorp`, workspace
`fjconsulting-website` — a VCS-driven workspace on this repository with working
directory `infra/`, matching the convention the other workspaces in that org
already follow.

Two workspace variables are required before the first run:

| Variable | Kind | Notes |
| --- | --- | --- |
| `account_id` | Terraform | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Environment, **sensitive** | Needs Zone: DNS Edit, Zone: Zone Read, Account: Pages Edit |

Nothing here is imported. The Pages project is created by CI and deliberately
not declared; every resource Terraform does declare — the DNS records and the
custom-domain bindings — is created by Terraform from scratch.
