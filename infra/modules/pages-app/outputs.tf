output "hostnames" {
  description = "Hostnames bound to the Pages project."
  value       = var.hostnames
}

output "pages_hostname" {
  description = "The *.pages.dev hostname every custom domain points at."
  value       = local.pages_hostname
}

output "urls" {
  description = "Public HTTPS URLs for the bound hostnames."
  value       = [for h in var.hostnames : "https://${h}"]
}
