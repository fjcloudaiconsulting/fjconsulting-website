output "dev_urls" {
  description = "Public URLs for the dev environment."
  value       = [for h in var.dev_hostnames : "https://${h}"]
}

output "dev_pages_hostname" {
  description = "Cloudflare-provided hostname backing the dev site."
  value       = local.dev_pages_hostname
}
