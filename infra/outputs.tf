output "dev_urls" {
  description = "Public URLs for the dev environment."
  value       = module.website_dev.urls
}

output "dev_pages_hostname" {
  description = "Cloudflare-provided hostname backing the dev site."
  value       = module.website_dev.pages_hostname
}

output "prod_urls" {
  description = "Public URLs for production. Empty until enable_prod is true."
  value       = var.enable_prod ? module.website_prod[0].urls : []
}
