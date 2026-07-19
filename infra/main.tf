terraform {
  required_version = ">= 1.9"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.22"
    }
  }

  # State lives in Terraform Cloud (VCS-driven workspace, working directory
  # `infra/`). Nothing is stored in the repository.
  cloud {
    organization = "fjconsulting"

    workspaces {
      name = "fjconsulting-website"
    }
  }
}

# API token comes from the CLOUDFLARE_API_TOKEN environment variable, set as a
# sensitive variable on the Terraform Cloud workspace. Never committed.
provider "cloudflare" {}

/*
 * fjconsulting.dev — the shared non-production estate.
 *
 * The zone already exists (the domain was transferred to Cloudflare), so it is
 * looked up rather than created. Terraform does not own the zone lifecycle:
 * destroying this configuration must never be able to delete the domain.
 */
data "cloudflare_zone" "dev" {
  filter = {
    name = var.dev_zone_name
  }
}

module "website_dev" {
  source = "./modules/pages-app"

  account_id   = var.account_id
  zone_id      = data.cloudflare_zone.dev.zone_id
  project_name = var.dev_project_name
  hostnames    = var.dev_hostnames
  environment  = "dev"
}

/*
 * fjconsulting.io — production.
 *
 * Gated behind enable_prod because the .io domain is still hosting unrelated
 * production services and has not been moved to Cloudflare yet. Flip the flag
 * once the zone is active; nothing else needs to change.
 */
data "cloudflare_zone" "prod" {
  count = var.enable_prod ? 1 : 0

  filter = {
    name = var.prod_zone_name
  }
}

module "website_prod" {
  count  = var.enable_prod ? 1 : 0
  source = "./modules/pages-app"

  account_id   = var.account_id
  zone_id      = data.cloudflare_zone.prod[0].zone_id
  project_name = var.prod_project_name
  hostnames    = var.prod_hostnames
  environment  = "prod"
}
