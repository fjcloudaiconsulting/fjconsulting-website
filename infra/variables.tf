variable "account_id" {
  description = "Cloudflare account ID. Set as a Terraform Cloud workspace variable."
  type        = string
}

# ---- dev (fjconsulting.dev) -------------------------------------------------

variable "dev_zone_name" {
  description = "Cloudflare zone for the non-production estate."
  type        = string
  default     = "fjconsulting.dev"
}

variable "dev_project_name" {
  description = "Cloudflare Pages project serving the dev site."
  type        = string
  default     = "fjconsulting-website-dev"
}

variable "dev_hostnames" {
  description = "Hostnames bound to the dev Pages project."
  type        = list(string)
  default     = ["fjconsulting.dev", "dev.fjconsulting.dev"]
}

# ---- prod (fjconsulting.io) -------------------------------------------------

variable "enable_prod" {
  description = <<-EOT
    Whether to manage the production estate. Keep false until fjconsulting.io
    has been transferred to Cloudflare and its zone is active; the .io domain
    currently hosts unrelated production services, so nothing should touch it
    until the owner has moved it deliberately.
  EOT
  type        = bool
  default     = false
}

variable "prod_zone_name" {
  description = "Cloudflare zone for production."
  type        = string
  default     = "fjconsulting.io"
}

variable "prod_project_name" {
  description = "Cloudflare Pages project serving the production site."
  type        = string
  default     = "fjconsulting-website-prod"
}

variable "prod_hostnames" {
  description = "Hostnames bound to the production Pages project."
  type        = list(string)
  default     = ["fjconsulting.io", "www.fjconsulting.io"]
}
