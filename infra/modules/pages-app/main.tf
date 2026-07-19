terraform {
  required_version = ">= 1.9"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.22"
    }
  }
}

/*
 * Binds one or more hostnames to an existing Cloudflare Pages project.
 *
 * Deliberately does NOT create the Pages project. The project is created by the
 * first `wrangler pages deploy` from CI, and Terraform adopts it afterwards.
 * Two reasons:
 *
 *   1. It avoids a create/create collision between CI and Terraform racing to
 *      own the same object.
 *   2. It keeps a clean split of ownership: GitHub Actions owns deployments,
 *      Terraform owns how the world reaches them.
 *
 * Every app onboarded under fjconsulting.dev instantiates this module rather
 * than hand-writing DNS.
 */

locals {
  # Cloudflare serves every Pages project at <project>.pages.dev. That is the
  # CNAME target for each custom hostname.
  pages_hostname = "${var.project_name}.pages.dev"
}

# Attaches the custom domain to the Pages project. Cloudflare issues and renews
# the certificate once the matching DNS record below resolves.
resource "cloudflare_pages_domain" "this" {
  for_each = toset(var.hostnames)

  account_id   = var.account_id
  project_name = var.project_name
  name         = each.value
}

# Proxied CNAME. At the zone apex Cloudflare flattens the CNAME automatically,
# so the same record shape works for both apex and subdomains.
resource "cloudflare_dns_record" "this" {
  for_each = toset(var.hostnames)

  zone_id = var.zone_id
  name    = each.value
  type    = "CNAME"
  content = local.pages_hostname
  proxied = true
  # Proxied records must use ttl = 1, which Cloudflare reads as "automatic".
  ttl     = 1
  comment = "Managed by Terraform — ${var.project_name} (${var.environment})"

  # The certificate cannot be issued until the record resolves, so create the
  # binding first and let Cloudflare validate once DNS is in place.
  depends_on = [cloudflare_pages_domain.this]
}
