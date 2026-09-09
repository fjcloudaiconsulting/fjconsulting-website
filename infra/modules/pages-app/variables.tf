variable "account_id" {
  description = "Cloudflare account ID that owns the Pages project."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID the hostnames belong to."
  type        = string
}

variable "project_name" {
  description = <<-EOT
    Name of the existing Cloudflare Pages project. The project must already
    exist: it is created by the first `wrangler pages deploy` from CI, not by
    this module. See the note in main.tf.
  EOT
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,57}[a-z0-9]$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-59 characters."
  }
}

variable "hostnames" {
  description = <<-EOT
    Fully-qualified hostnames to bind to the project, for example
    ["app.fjconsulting.dev"]. Apex domains are supported: Cloudflare flattens
    the CNAME automatically.
  EOT
  type        = list(string)

  validation {
    condition     = length(var.hostnames) > 0
    error_message = "At least one hostname is required."
  }

  validation {
    condition     = alltrue([for h in var.hostnames : can(regex("^[a-z0-9.-]+\\.[a-z]{2,}$", h))])
    error_message = "Each hostname must be a valid lowercase FQDN."
  }
}

variable "environment" {
  description = "Environment label, used in resource comments. For example dev or prod."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}
