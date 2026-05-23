terraform {
  required_providers {
    netlayer = {
      source  = "netlayer-global/netlayer"
      version = "~> 0.1"
    }
  }
}

provider "netlayer" {
  api_url = "http://localhost:5000/api"
  # api_key = var.netlayer_api_key (or NETLAYER_API_KEY)
}

data "netlayer_plan" "small" {
  slug = "c3.large"
}

resource "netlayer_server" "web" {
  name           = "tf-managed-web-01"
  plan_id        = data.netlayer_plan.small.id
  region_id      = "REPLACE_WITH_REGION_ID" # use `nl regions` to find IDs
  os_template_id = "REPLACE_WITH_OS_ID"     # use `nl os` to find IDs
}

output "ipv4" {
  value = netlayer_server.web.ipv4
}

output "hostname" {
  value = netlayer_server.web.hostname
}
