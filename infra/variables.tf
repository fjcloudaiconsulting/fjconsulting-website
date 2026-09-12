variable "account_id" {
  description = "Cloudflare account ID. Set as a Terraform Cloud workspace variable."
  type        = string
}

variable "dev_zone_name" {
  description = "Cloudflare zone for the non-production estate."
  type        = string
  default     = "fjconsulting.dev"
}

variable "dev_project_name" {
  description = "Cloudflare Pages project serving the dev site. Created by CI, not by Terraform."
  type        = string
  default     = "fjconsulting-website-dev"
}

variable "dev_hostnames" {
  description = "Hostnames bound to the dev Pages project. Apex is supported: Cloudflare flattens the CNAME."
  type        = list(string)
  default     = ["fjconsulting.dev"]

  validation {
    condition     = length(var.dev_hostnames) > 0
    error_message = "At least one hostname is required."
  }
}
