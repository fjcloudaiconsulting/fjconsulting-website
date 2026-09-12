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
    organization = "FlamaCorp"

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

locals {
  # Cloudflare serves every Pages project at <project>.pages.dev. That is the
  # CNAME target for each custom hostname.
  dev_pages_hostname = "${var.dev_project_name}.pages.dev"
}

/*
 * Deliberately absent: the Pages project itself.
 *
 * It is created by the first deploy from CI, and Terraform adopts it. That
 * avoids a create/create collision between CI and Terraform racing to own the
 * same object, and keeps the ownership split clean — GitHub Actions owns
 * deployments, Terraform owns how the world reaches them.
 */

# Attaches the custom domains to the Pages project. Cloudflare issues and renews
# the certificates once the matching DNS records below resolve.
resource "cloudflare_pages_domain" "dev" {
  for_each = toset(var.dev_hostnames)

  account_id   = var.account_id
  project_name = var.dev_project_name
  name         = each.value
}

# Proxied CNAME. At the zone apex Cloudflare flattens the CNAME automatically,
# so the same record shape works for both apex and subdomains.
resource "cloudflare_dns_record" "dev" {
  for_each = toset(var.dev_hostnames)

  zone_id = data.cloudflare_zone.dev.zone_id
  name    = each.value
  type    = "CNAME"
  content = local.dev_pages_hostname
  proxied = true
  # Proxied records must use ttl = 1, which Cloudflare reads as "automatic".
  ttl     = 1
  comment = "Managed by Terraform - ${var.dev_project_name}"

  # The certificate cannot be issued until the record resolves, so create the
  # binding first and let Cloudflare validate once DNS is in place.
  depends_on = [cloudflare_pages_domain.dev]
}

/*
 * Email address obfuscation, off.
 *
 * Cloudflare rewrites every mailto: in the HTML into a /cdn-cgi/l/
 * email-protection link that only JavaScript can decode. The site's primary
 * call to action is a mailto:, so with JS unavailable that link resolves to a
 * Cloudflare 404 instead of the inbox.
 *
 * It also buys nothing here: the same address is published in clear text in
 * the page's JSON-LD, in the footer, and on the KvK register. The obfuscation
 * costs a working link and hides nothing.
 */
resource "cloudflare_zone_setting" "email_obfuscation" {
  zone_id    = data.cloudflare_zone.dev.zone_id
  setting_id = "email_obfuscation"
  value      = "off"
}
