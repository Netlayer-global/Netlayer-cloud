# terraform-provider-netlayer

Official [Terraform](https://www.terraform.io/) provider for **NetLayer Cloud**.

> Status: **alpha skeleton**. The provider compiles and registers a `netlayer_server`
> resource against the NetLayer REST API. Additional resources
> (`netlayer_volume`, `netlayer_load_balancer`, `netlayer_managed_database`,
> `netlayer_dns_zone`, `netlayer_vpc`, `netlayer_object_bucket`,
> `netlayer_ssh_key`) and data sources (`netlayer_plan`, `netlayer_region`,
> `netlayer_os`) follow the same pattern in `internal/resources/`.

## Use it

```hcl
terraform {
  required_providers {
    netlayer = {
      source  = "netlayer-global/netlayer"
      version = "~> 0.1"
    }
  }
}

provider "netlayer" {
  api_url = "https://api.netlayer.com"
  api_key = var.netlayer_api_key  # or NETLAYER_API_KEY
}

data "netlayer_plan" "small" {
  slug = "c3.large"
}

data "netlayer_region" "mumbai" {
  slug = "bom1"
}

data "netlayer_os" "ubuntu" {
  slug = "ubuntu-22-04"
}

resource "netlayer_server" "web" {
  name           = "web-prod-01"
  plan_id        = data.netlayer_plan.small.id
  region_id      = data.netlayer_region.mumbai.id
  os_template_id = data.netlayer_os.ubuntu.id
}

output "server_ip" {
  value = netlayer_server.web.ipv4
}
```

## Build

```bash
cd terraform-provider-netlayer
go mod tidy
go build -o terraform-provider-netlayer
```

To use locally before publishing, drop the binary into:

- Linux/macOS: `~/.terraform.d/plugins/registry.terraform.io/netlayer-global/netlayer/0.1.0/<os>_<arch>/`
- Windows: `%APPDATA%\terraform.d\plugins\registry.terraform.io\netlayer-global\netlayer\0.1.0\windows_amd64\`

Then run `terraform init` in your config directory.

## Layout

```
terraform-provider-netlayer/
  main.go                       Provider entrypoint (terraform-plugin-framework)
  go.mod
  internal/
    provider/
      provider.go               Provider config (api_url, api_key)
      client.go                 Lightweight REST client used by every resource
    resources/
      server.go                 netlayer_server resource (CRUD lifecycle)
    datasources/
      plan.go                   netlayer_plan data source
```

## License

MIT
